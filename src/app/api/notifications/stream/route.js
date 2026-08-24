import connectDB from '@/config/connectDB'
import NotificationRecipient from '@/models/notificationRecipient'
import jwt from 'jsonwebtoken'
import { getJwtSecret, getCookieName } from '@/utils/env'

const clients = new Map() // Map<userIdString, Set<controller>>

function sendEvent(controller, data) {
  try {
    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
  } catch (err) {
    // Client disconnected
  }
}

export async function GET(request) {
  try {
    let decoded = null

    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      decoded = jwt.verify(token, getJwtSecret())
    }

    if (!decoded) {
      const cookieHeader = request.headers.get('cookie') || ''
      const cookieName = getCookieName()
      const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${cookieName}=([^;]*)`))
      if (match) {
        try {
          decoded = jwt.verify(match[1], getJwtSecret())
        } catch (e) {
          console.error('SSE cookie auth failed:', e.message)
        }
      }
    }

    if (!decoded) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userId = decoded._id || decoded.id
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userIdStr = userId.toString()

    const stream = new ReadableStream({
      start(controller) {
        let userSet = clients.get(userIdStr)
        if (!userSet) {
          userSet = new Set()
          clients.set(userIdStr, userSet)
        }
        userSet.add(controller)

        sendEvent(controller, { type: 'connected', message: 'SSE connected' })

        // Heartbeat keep-alive ping every 25s
        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(': ping\n\n')
          } catch {
            clearInterval(pingInterval)
          }
        }, 25000)

        controller._pingInterval = pingInterval
      },
      cancel(controller) {
        if (controller?._pingInterval) {
          clearInterval(controller._pingInterval)
        }
        const userSet = clients.get(userIdStr)
        if (userSet) {
          userSet.delete(controller)
          if (userSet.size === 0) {
            clients.delete(userIdStr)
          }
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('SSE auth error:', error)
    return new Response('Unauthorized', { status: 401 })
  }
}

export async function broadcastNotification(notificationId, type = 'new_notification') {
  await connectDB()
  const recipients = await NotificationRecipient.find({ notification: notificationId }).lean()

  for (const recipient of recipients) {
    const userId = recipient.user.toString()
    const userSet = clients.get(userId)
    if (userSet && userSet.size > 0) {
      const { default: Notification } = await import('@/models/notification')
      const notification = await Notification.findById(notificationId).lean()
      for (const controller of userSet) {
        sendEvent(controller, { type, notification })
      }
    }
  }
}

export async function broadcastUnreadUpdate(userId, data) {
  const userSet = clients.get(userId.toString())
  if (userSet && userSet.size > 0) {
    for (const controller of userSet) {
      sendEvent(controller, { type: 'count_update', ...data })
    }
  }
}
