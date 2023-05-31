import { redis } from "@budibase/backend-core"
import { getGlobalIDFromUserMetadataID } from "../db/utils"
import { ContextUser, SocketUser } from "@budibase/types"

const APP_DEV_LOCK_SECONDS = 600
const AUTOMATION_TEST_FLAG_SECONDS = 60
let devAppClient: any, debounceClient: any, flagClient: any, socketClient: any

// We need to maintain a duplicate client for socket.io pub/sub
let socketSubClient: any

// We init this as we want to keep the connection open all the time
// reduces the performance hit
export async function init() {
  devAppClient = new redis.Client(redis.utils.Databases.DEV_LOCKS)
  debounceClient = new redis.Client(redis.utils.Databases.DEBOUNCE)
  flagClient = new redis.Client(redis.utils.Databases.FLAGS)
  socketClient = new redis.Client(redis.utils.Databases.SOCKET_IO)
  await devAppClient.init()
  await debounceClient.init()
  await flagClient.init()
  await socketClient.init()

  // Duplicate the socket client for pub/sub
  socketSubClient = socketClient.getClient().duplicate()
}

export async function shutdown() {
  console.log("REDIS SHUTDOWN")
  if (devAppClient) await devAppClient.finish()
  if (debounceClient) await debounceClient.finish()
  if (flagClient) await flagClient.finish()
  if (socketClient) await socketClient.finish()
  if (socketSubClient) socketSubClient.disconnect()
  // shutdown core clients
  await redis.clients.shutdown()
  console.log("Redis shutdown")
}

export async function doesUserHaveLock(devAppId: string, user: ContextUser) {
  const value = await devAppClient.get(devAppId)
  if (!value) {
    return true
  }
  // make sure both IDs are global
  const expected = getGlobalIDFromUserMetadataID(value._id)
  const userId = getGlobalIDFromUserMetadataID(user._id!)
  return expected === userId
}

export async function getLocksById(appIds: string[]) {
  return await devAppClient.bulkGet(appIds)
}

export async function updateLock(devAppId: string, user: ContextUser) {
  // make sure always global user ID
  const globalId = getGlobalIDFromUserMetadataID(user._id!)
  const inputUser = {
    ...user,
    userId: globalId,
    _id: globalId,
    lockedAt: new Date().getTime(),
  }

  await devAppClient.store(devAppId, inputUser, APP_DEV_LOCK_SECONDS)
}

export async function clearLock(devAppId: string, user: ContextUser) {
  const value = await devAppClient.get(devAppId)
  if (!value) {
    return
  }
  const userId = getGlobalIDFromUserMetadataID(user._id!)
  if (value._id !== userId) {
    throw "User does not hold lock, cannot clear it."
  }
  await devAppClient.delete(devAppId)
}

export async function checkDebounce(id: string) {
  return debounceClient.get(id)
}

export async function setDebounce(id: string, seconds: number) {
  await debounceClient.store(id, "debouncing", seconds)
}

export async function setTestFlag(id: string) {
  await flagClient.store(id, { testing: true }, AUTOMATION_TEST_FLAG_SECONDS)
}

export async function checkTestFlag(id: string) {
  const flag = await flagClient.get(id)
  return !!(flag && flag.testing)
}

export async function clearTestFlag(id: string) {
  await devAppClient.delete(id)
}

export async function getSocketUsers(path: string, room: string) {
  return await socketClient.get(`${path}:${room}`)
}

export async function setSocketUsers(path: string, room: string, users: SocketUser[]) {
  await socketClient.store(`${path}:${room}`, users)
}

export function getSocketPubSubClients() {
  return {
    pub: socketClient.getClient(),
    sub: socketSubClient,
  }
}
