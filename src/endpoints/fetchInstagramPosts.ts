// src/endpoints/fetchInstagramPosts.ts
import { Endpoint, PayloadRequest } from 'payload'
import { ScrapflyClient, ScrapeConfig, errors as ScrapflyErrors } from 'scrapfly-sdk'
import { addDataAndFileToRequest } from 'payload' // Corrected import
import path from 'path'
import { Buffer } from 'buffer'
import type { Media, User } from '../payload-types' // Import generated types

const getTodayDateString = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function downloadAsset(
  url: string,
  filenamePrefix: string,
  reqPayload: PayloadRequest['payload'],
): Promise<{ id: number; filename: string } | null> {
  if (!url) return null
  try {
    reqPayload.logger.info(`[Download Asset] Attempting to download: ${url}`)
    const response = await fetch(url)
    if (!response.ok) {
      reqPayload.logger.error(`[Download Asset] Failed to download ${url}: ${response.statusText}`)
      return null
    }
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const originalUrlPath = new URL(url).pathname
    let extension = path.extname(originalUrlPath) || '.jpg'
    if (extension && !extension.startsWith('.')) {
      extension = `.${extension}`
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const safeFilenamePrefix = filenamePrefix.replace(/[^a-zA-Z0-9_-]/g, '_')
    const filename = `${safeFilenamePrefix}${extension}`

    reqPayload.logger.info(
      `[Download Asset] Uploading ${filename} (size: ${buffer.length}, type: ${contentType}) to media collection.`,
    )

    const mediaDoc = await reqPayload.create({
      collection: 'media',
      data: { alt: `${safeFilenamePrefix} Instagram content` },
      file: { name: filename, data: buffer, mimetype: contentType, size: buffer.length },
    })
    reqPayload.logger.info(
      `[Download Asset] Successfully uploaded ${filename}, Media ID (string from create): ${mediaDoc.id}`,
    )

    const numericId = parseInt(mediaDoc.id as string, 10) // mediaDoc.id from create is string
    if (isNaN(numericId)) {
      reqPayload.logger.error(
        `[Download Asset] Failed to parse numeric ID from mediaDoc.id: ${mediaDoc.id} for ${filename}`,
      )
      return null
    }
    return { id: numericId, filename: mediaDoc.filename as string }
  } catch (error: any) {
    reqPayload.logger.error(
      `[Download Asset] Error processing asset from ${url}: ${error.stack || error.message}`,
    )
    return null
  }
}

const fetchInstagramPostsEndpoint: Endpoint = {
  path: '/fetch-instagram-posts',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    if (!req.user) {
      return Response.json({ message: 'Unauthorized. You must be logged in.' }, { status: 401 })
    }

    await addDataAndFileToRequest(req) // Corrected: pass as object
    const { userId: userIdFromRequest, instagramUsername: inputUsername } = req.data as {
      userId?: string
      instagramUsername?: string
    }

    if (!userIdFromRequest) {
      return Response.json({ message: 'User ID not provided in request body.' }, { status: 400 })
    }
    if (userIdFromRequest) {
      // Compare with authenticated user
      return Response.json({ message: 'Forbidden. User ID mismatch.' }, { status: 403 })
    }

    const targetUsername = inputUsername?.trim() || process.env.INSTAGRAM_USERNAME_TO_SCRAPE
    if (!targetUsername) {
      return Response.json(
        { message: 'Instagram username not provided or configured.' },
        { status: 400 },
      )
    }

    const todayDate = getTodayDateString()

    // The 'user' field in FetchLog expects a number (ID of User) if Users collection ID is numeric.
    // req.user.id is usually string. Adjust if your Users collection primary key is numeric.
    // For now, assuming Users.id is string and FetchLog.user can accept string ID.
    // If Users.id is number, you'd do: const numericUserId = parseInt(req.user.id, 10);
    const logUserReference = req.user.id

    const logData = {
      user: logUserReference,
      date: todayDate,
      instagramUsername: targetUsername,
    }

    try {
      const existingFetch = await req.payload.find({
        collection: 'fetch-logs',
        where: {
          user: { equals: logUserReference }, // Use the correct ID type for user
          date: { equals: todayDate },
          instagramUsername: { equals: targetUsername },
          status: { equals: 'success' },
        },
        limit: 1,
        depth: 0,
      })

      if (existingFetch.totalDocs > 0) {
        await req.payload.create({
          collection: 'fetch-logs',
          data: {
            ...logData,
            status: 'rate_limited_user',
            message: 'User already fetched successfully today.',
          },
        })
        return Response.json(
          { message: `Fetch limit reached for ${targetUsername} today.` },
          { status: 429 },
        )
      }

      const scrapflyKey = process.env.SCRAPFLY_API_KEY
      if (!scrapflyKey) throw new Error('Scrapfly API key is not configured.')
      const scrapfly = new ScrapflyClient({ key: scrapflyKey })
      const igAppId = process.env.INSTAGRAM_APP_ID || '936619743392459'
      const instagramApiUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${targetUsername}`

      const scrapeConfig = new ScrapeConfig({
        url: instagramApiUrl,
        method: 'GET',
        headers: {
          'x-ig-app-id': igAppId,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          Accept: '*/*',
        },
        asp: true,
        country: 'US',
      })

      req.payload.logger.info(`[Instagram Fetch] Attempting for user: ${targetUsername}`)
      const scrapflyResponse = await scrapfly.scrape(scrapeConfig)
      req.payload.logger.info(
        `[Instagram Fetch] Scrapfly response status: ${scrapflyResponse.result.status_code} for ${targetUsername}`,
      )

      if (!scrapflyResponse.result.success || scrapflyResponse.result.status_code !== 200) {
        const errorDetail = scrapflyResponse.result.error
          ? JSON.stringify(scrapflyResponse.result.error)
          : 'No error details by Scrapfly.'
        throw new ScrapflyErrors.ScrapflyError(
          `Scrapfly request failed: ${scrapflyResponse.result.status} - ${errorDetail}`,
          { http_status_code: scrapflyResponse.result.status_code, api_response: scrapflyResponse },
        )
      }

      const instagramProfileData = JSON.parse(scrapflyResponse.result.content)
      if (!instagramProfileData?.data?.user?.edge_owner_to_timeline_media?.edges) {
        req.payload.logger.warn(
          `[Instagram Fetch] Unexpected API structure for ${targetUsername}: ${JSON.stringify(instagramProfileData).substring(0, 500)}`,
        )
        throw new Error(
          'Unexpected Instagram API response. User might be private, non-existent, or API changed.',
        )
      }

      const posts = instagramProfileData.data.user.edge_owner_to_timeline_media.edges
      let postsAdded = 0,
        postsSkipped = 0,
        postsFailedMediaProcessing = 0

      for (const item of posts) {
        const post = item.node
        req.payload.logger.info(
          `[Instagram Fetch] Processing post ${post.shortcode} for ${targetUsername}`,
        )

        let localImageId: number | undefined = undefined
        let localVideoId: number | undefined = undefined

        if (post.is_video && post.video_url) {
          const downloadedVideo = await downloadAsset(
            post.video_url,
            `${targetUsername}_${post.shortcode}_video`,
            req.payload,
          )
          if (downloadedVideo) localVideoId = downloadedVideo.id
          else postsFailedMediaProcessing++
        } else if (post.display_url) {
          const downloadedImage = await downloadAsset(
            post.display_url,
            `${targetUsername}_${post.shortcode}_image`,
            req.payload,
          )
          if (downloadedImage) localImageId = downloadedImage.id
          else postsFailedMediaProcessing++
        }

        const postDataForDb = {
          instagramPostId: post.id,
          shortcode: post.shortcode,
          ownerUsername: targetUsername,
          originalImageUrl: !post.is_video ? post.display_url : undefined,
          localImage: localImageId, // Will be number or undefined
          originalVideoUrl: post.is_video ? post.video_url : undefined,
          localVideo: localVideoId, // Will be number or undefined
          caption: post.edge_media_to_caption?.edges[0]?.node?.text || '',
          postDate: new Date(post.taken_at_timestamp * 1000).toISOString(),
          likesCount: post.edge_media_preview_like?.count || 0,
          commentsCount: post.edge_media_to_comment?.count || 0,
        }

        try {
          const existingPost = await req.payload.find({
            collection: 'instagram-posts',
            where: { instagramPostId: { equals: post.id } },
            limit: 1,
            depth: 0,
          })

          if (existingPost.totalDocs === 0) {
            await req.payload.create({ collection: 'instagram-posts', data: postDataForDb })
            postsAdded++
          } else {
            await req.payload.update({
              collection: 'instagram-posts',
              id: existingPost.docs[0].id,
              data: {
                localImage:
                  localImageId !== undefined
                    ? localImageId
                    : ((existingPost.docs[0].localImage as number | Media | null) ?? undefined),
                localVideo:
                  localVideoId !== undefined
                    ? localVideoId
                    : ((existingPost.docs[0].localVideo as number | Media | null) ?? undefined),
                likesCount: postDataForDb.likesCount,
                commentsCount: postDataForDb.commentsCount,
                caption: postDataForDb.caption,
                originalImageUrl: postDataForDb.originalImageUrl,
                originalVideoUrl: postDataForDb.originalVideoUrl,
              },
            })
            postsSkipped++
            req.payload.logger.info(`[Instagram Fetch] Updated existing post ${post.shortcode}`)
          }
        } catch (dbError: any) {
          req.payload.logger.error(
            `[Instagram Fetch] Error saving/updating post ${post.id} for ${targetUsername} to DB: ${dbError.message}`,
          )
        }
      }

      const successMessage = `Fetched for ${targetUsername}. Added: ${postsAdded}, Updated/Skipped: ${postsSkipped}, Media Processing Failed: ${postsFailedMediaProcessing}. Total from API: ${posts.length}.`
      await req.payload.create({
        collection: 'fetch-logs',
        data: { ...logData, status: 'success', message: successMessage },
      })
      return Response.json({ message: successMessage }, { status: 200 })
    } catch (error: any) {
      req.payload.logger.error(
        `[Instagram Fetch] General error for ${targetUsername}: ${error.message} ${error.stack}`,
      )
      await req.payload.create({
        collection: 'fetch-logs',
        data: { ...logData, status: 'failed', message: error.message },
      })
      const statusCode =
        error instanceof ScrapflyErrors.HttpError && error.args?.http_status_code
          ? error.args.http_status_code
          : 500
      return Response.json(
        { message: `Error fetching posts: ${error.message}` },
        { status: statusCode },
      )
    }
  },
}

export default fetchInstagramPostsEndpoint
