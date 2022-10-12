class Response {
    render(res, content_type, filename, data) {
        res.header('Content-Type', content_type);
        res.header('Content-Disposition', `inline; filename="${filename}"`);
        return res.send(data);     
    }    
    response(res, message, status_code, status, data) {
        return res.status(status_code).send({
            status, message, data
        }).end()
    }
    internalServerError(res, message  = 'An unknown error occurred while executing request. If this issue persists, please contact a member of support at hello@danoice.com', data = []) {
        return this.response(res, message, 500, false, data)
    }
    sendError(res, {message, status_code = 400, data = null}) {
        return this.response(res, message, status_code, false, data)
    }
    renderSuccess(res, {content_type, filename = "", data = null}) {
        return this.render(res, content_type, filename, data)
    }
    sendSuccess(res, {message, status_code = 200, data = null}) {
        return this.response(res, message, status_code, true, data)
    }
}

const response = ()  => {
    return new Response()
}
module.exports = response()