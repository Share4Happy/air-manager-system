import connectDB from '@/config/connectDB'
import NotificationSetting from '@/models/notificationSetting'

export async function getSettings() {
  await connectDB()
  return NotificationSetting.find().sort({ key: 1 }).lean()
}

export async function updateSetting(key, value, userId) {
  await connectDB()
  const setting = await NotificationSetting.findOneAndUpdate(
    { key },
    { $set: { value, updated_by: userId } },
    { upsert: true, new: true }
  )
  return setting
}
