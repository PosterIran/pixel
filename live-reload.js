(function() {
    var lastModified = null;

    function check() {
        var xhr = new XMLHttpRequest();

        xhr.open(
            'HEAD',
            './index.html?check=' + new Date().getTime(),
            true
        );

        xhr.setRequestHeader('Cache-Control', 'no-cache');

        xhr.onload = function() {

            if (xhr.status === 200) {

                var newLastModified =
                    xhr.getResponseHeader('Last-Modified');

                if (
                    lastModified &&
                    newLastModified &&
                    newLastModified !== lastModified
                ) {
                    window.location.reload();
                    return;
                }

                lastModified = newLastModified;
            }

            setTimeout(check, 3000);
        };

        xhr.onerror = function() {
            setTimeout(check, 5000);
        };

        xhr.send();
    }

    window.addEventListener('load', check);
})();