const buckets = new Map()

const DEFAULT_BUCKET = '__default__'

const queueJob = (bucketOrTask, maybeTask) => {
    const task = typeof bucketOrTask === 'function' ? bucketOrTask : maybeTask
    const bucket = typeof bucketOrTask === 'string' ? bucketOrTask : DEFAULT_BUCKET

    if (typeof task !== 'function') {
        return Promise.reject(new TypeError('queueJob expects an async task'))
    }

    const previous = buckets.get(bucket) || Promise.resolve()
    const run = previous.then(() => task(), () => task())
    const settled = run.then(
        (value) => {
            if (buckets.get(bucket) === settled) buckets.delete(bucket)
            return value
        },
        (error) => {
            if (buckets.get(bucket) === settled) buckets.delete(bucket)
            throw error
        }
    )

    buckets.set(bucket, settled)
    return settled
}

export default queueJob
