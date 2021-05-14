import {
  AccountStorageQuery,
  AccountStorageMutation,
  UserStorageQuery,
  UserStorageMutation,
} from 'nr1'

export const NerdstoreDefaults = {
  CONFIG_COLLECTION_NAME: 'InnovationCICD',
}

const getDocumentId = name => name.replace(/\W+/g, '_')

export const readAccountCollection = async (
  accountId,
  collection,
  documentId
) => {
  const payload = { accountId, collection }
  if (documentId) payload.documentId = getDocumentId(documentId)
  const result = await AccountStorageQuery.query(payload)
  const collectionResult = (result || {}).data || (documentId ? null : [])
  return collectionResult
}

export const writeAccountDocument = async (
  accountId,
  collection,
  documentId,
  payload
) => {
  const result = await AccountStorageMutation.mutate({
    accountId,
    actionType: AccountStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
    collection,
    documentId: getDocumentId(documentId),
    document: payload,
  })
  return result
}

export const readUserCollection = async (collection, documentId) => {
  const payload = { collection }
  if (documentId) payload.documentId = getDocumentId(documentId)
  const result = await UserStorageQuery.query(payload)
  const collectionResult = (result || {}).data || (documentId ? null : [])
  return collectionResult
}

export const writeUserDocument = async (collection, documentId, payload) => {
  const result = await UserStorageMutation.mutate({
    actionType: UserStorageMutation.ACTION_TYPE.WRITE_DOCUMENT,
    collection,
    documentId: getDocumentId(documentId),
    document: payload,
  })
  return result
}
