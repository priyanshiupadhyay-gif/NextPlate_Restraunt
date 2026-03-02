const sendResponse = (res, statusCode, success, message, data = null, meta = null) => {
    const response = {
        success,
        message,
        timestamp: new Date().toISOString()
    };

    if (data !== null) {
        response.data = data;
    }

    if (meta !== null) {
        response.meta = meta;
    }

    return res.status(statusCode).json(response);
};

const sendSuccess = (res, message = 'Success', data = null, statusCode = 200) => {
    return sendResponse(res, statusCode, true, message, data);
};

const sendCreated = (res, message = 'Resource created successfully', data = null) => {
    return sendResponse(res, 201, true, message, data);
};

const sendError = (res, message = 'An error occurred', statusCode = 500, error = null) => {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString()
    };

    if (error && process.env.NODE_ENV === 'development') {
        response.error = error.message || error;
    }

    return res.status(statusCode).json(response);
};

const paginate = (query, schema) => {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
        pagination: {
            page,
            limit,
            total: null,
            pages: null
        }
    };
};

const buildPaginationMeta = async (model, query, baseFilter = {}) => {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    const total = await model.countDocuments(baseFilter);
    const pages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        pages,
        hasNextPage: page < pages,
        hasPrevPage: page > 1
    };
};

module.exports = {
    sendResponse,
    sendSuccess,
    sendCreated,
    sendError,
    paginate,
    buildPaginationMeta
};
