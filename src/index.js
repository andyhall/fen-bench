

module.exports = function Bench() {
    var self = this


    /*
     * 
     *      API
     * 
    */

    this.testCases = []
    this.results = []

    this.testDuration = 150
    this.pauseDuration = 10
    this.maxMeasurements = 10

    this.start = () => { if (self.running) return; self.running = true; runTests() }
    this.stop = () => { self.running = false }
    this.running = false

    this.callback = () => { }

    this.reset = () => {
        testIndex = 0
        this.results.length = 0
    }



    /*
    * 
    *      implementation 
    * 
    */

    var testObjects = []
    var testIndex = 0




    function runTests() {
        if (!self.running) return
        var tests = self.testCases
        var results = self.results
        if (tests.length === 0) return bail('No test cases defined')

        // conform internals and next test case
        while (results.length > tests.length) results.pop()
        if (testIndex >= tests.length) testIndex = 0
        var testFn = tests[testIndex]
        var testObj = testObjects[testIndex]
        if (!testObj || (testObj.fn !== testFn)) {
            testObjects[testIndex] = makeTestObject(testFn)
            testObj = testObjects[testIndex]
            results[testIndex] = { ops: 0, dev: 0 }
        }

        // synchronously run one battery on one function
        var returnVal = runBattery(testObj.fn, self.testDuration, testObj.results)

        // conform return value
        if (undef(returnVal)) return bail('Test cases must return a value')
        if (!undef(testObj.lastReturnValue) && returnVal !== testObj.lastReturnValue) {
            return bail('Test case returned inconsistent values')
        }
        testObj.lastReturnValue = returnVal

        // update test obj results
        while (testObj.results.length > self.maxMeasurements) testObj.results.pop()
        while (results.length <= testIndex) results.push({ ops: 0, dev: 0 })
        results[testIndex].ops = mean(testObj.results)
        results[testIndex].dev = deviation(testObj.results)

        // callback after each full cycle, then iterate
        testIndex++
        if (testIndex >= tests.length) self.callback()
        if (self.running) setTimeout(runTests, self.pauseDuration)
    }

    function bail(msg) {
        console.warn(msg)
        self.stop()
    }
}



function makeTestObject(fn) {
    if (typeof fn !== 'function') throw 'Test case must be function'
    return {
        fn: fn,
        results: [],
        lastReturnValue: undefined,
    }
}


function runBattery(fn, dur, results) {
    var start = now()
    var end = start + dur
    var t = start
    var ops = 0
    var returnVal
    while (t < end) {
        returnVal = fn()
        ops++
        t = now()
    }
    results.unshift(1000 * ops / (t - start))
    return returnVal
}





/*
 * 
 * 
 *      helpers
 * 
 * 
*/

var undef = val => (typeof val === 'undefined')
var sum = (a, b) => a + b
var mean = arr => arr.reduce(sum, 0) / arr.length
var deviation = arr => {
    var avg = mean(arr)
    var sqdev = mean(arr.map(num => (num - avg) ** 2))
    return Math.sqrt(sqdev)
}
var now = (() => {
    if (typeof performance === 'object') return () => performance.now()
    return () => Date.now()
})()

