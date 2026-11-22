const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Loi he thong may chu";

    if (err.name === "CastError"){
        statusCode = 404;
        message = "Khong tim thay du lieu voi ID hop le";
    }

    if (err.code == 11000){
        statusCode = 400;
        message = "Du lieu bi trung lap tren he thong";
    }

    if (err.name === "ValidationError"){
        statusCode = 400;
        message = Object.values(err.errors)
            .map((item) => item.message)
            .join(", ");
    }

    res.status(statusCode).json({
        success: false,
        message,
    });
};

module.exports = errorMiddleware;
