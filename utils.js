exports.execute = function(f) {
    if(!process.env.TESTING) {
        f();
    }
}

exports.round = function (number, decimalPlaces) {
    const factorOfTen = Math.pow(10, decimalPlaces);
    return Math.round(number * factorOfTen) / factorOfTen;
}

exports.filter = function (name, values) {
    return !(name && values && (values.include && !values.include.includes(name)
        || values.exclude && values.exclude.includes(name)));
}
