const acceptedMethods = ['POST']

export default async (event) => {
    const req = event.request
    const colo = req.cf.colo

    if (acceptedMethods.indexOf(req.method) >= 0) {
        return new Response(
            JSON.stringify({
                message: 'Hello there',
                colo: colo,
            })
        )
    } else {
        return new Response(`Cannot ${req.method} /api/hello. Please use POST.`)
    }
}
