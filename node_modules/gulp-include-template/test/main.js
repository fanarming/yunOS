/**
 * Created by patrickliu on 15/7/3.
 */

var assert = require('assert'),
    fs = require('fs');


describe('normal', function() {

    function compare(src, dest, done) {
        var srcContent = fs.readFileSync(__dirname + '/compiled/' + src, 'utf-8'),
            destContent = fs.readFileSync(__dirname + '/expected/' + dest, 'utf-8');

        assert.equal(srcContent, destContent);
        done();
    }

    describe('onlyInclude', function() {
        it('compiled onlyInclude.html should equal expected onlyInclude.html', function(done) {
            compare('onlyInclude.html', 'onlyInclude.html', done);
        });
    });

    describe('onlyIncludeNative', function() {
        it('compiled onlyIncludeNative.html should equal expected onlyIncludeNative.html', function(done) {
            compare('onlyIncludeNative.html', 'onlyIncludeNative.html', done);
        });
    });

    describe('includeAndIncludeNative', function() {
        it('compiled includeAndIncludeNative.html should equal expected includeAndIncludeNative.html', function(done) {
            compare('includeAndIncludeNative.html', 'includeAndIncludeNative.html', done);
        });
    });

    describe('mixed', function() {
        it('compiled mixed.html should equal expected mixed.html', function(done) {
            compare('mixed.html', 'mixed.html', done);
        });
    });
});
