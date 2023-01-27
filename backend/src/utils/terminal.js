export var Terminal;
(function (Terminal) {
    function log(text) {
        console.log("\u001B[94m[*] ".concat(text));
    }
    Terminal.log = log;
    function warning(text) {
        console.log("\u001B[93m[?] ".concat(text));
    }
    Terminal.warning = warning;
    function error(text) {
        console.log("\u001B[91m[!] ".concat(text));
    }
    Terminal.error = error;
})(Terminal || (Terminal = {}));
