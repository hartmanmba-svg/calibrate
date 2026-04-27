// IndexedDB module for offline review queue.
// Uses a promise-cached DB handle to avoid race conditions on concurrent opens.

const DB_NAME = 'calibrate-offline'
const DB_VERSION = 1

export type OfflineReview = {
  id?: number
  card_id: string
  rating: 1 | 2 | 3
  reviewed_at: string
  nonce: string
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION)
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('offline_queue')) {
          db.createObjectStore('offline_queue', { keyPath: 'id', autoIncrement: true })
        }
      }
      req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

export async function enqueueReview(review: Omit<OfflineReview, 'id'>): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readwrite')
    tx.objectStore('offline_queue').add(review)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getAllQueuedReviews(): Promise<OfflineReview[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readonly')
    const req = tx.objectStore('offline_queue').getAll()
    req.onsuccess = () => resolve(req.result as OfflineReview[])
    req.onerror = () => reject(req.error)
  })
}

export async function clearQueuedReview(id: number): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readwrite')
    tx.objectStore('offline_queue').delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
