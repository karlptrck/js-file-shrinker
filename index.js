const fs = require('fs');

if (process.argv.length < 5) {
    console.error("Super file shrinker v1.0.0");
    console.error("    node shrinker.js shrink <input-file> <output-file>");
    console.error("    node shrinker.js unshrink <input-file> <output-file>");
    process.exit(1);
}

let mode = process.argv[2];
let inputFile = process.argv[3];
let outputFile = process.argv[4];

let inputBytes = Array.prototype.slice.call(fs.readFileSync(inputFile));
let outputBytes;

if (mode === 'shrink') outputBytes = shrink(inputBytes);
else if (mode === 'unshrink') outputBytes = unshrink(inputBytes);
else throw("Unknown mode: " + mode);

fs.writeFileSync(outputFile, new Buffer.from(outputBytes));

function shrink(input) {
    console.log(`shrink input: ${input}`)
    
    let output = isSequential(input) ? shrinkDE(input) : shrinkRLE(input)

    console.log(`shrink output: ${output}`)
    return output
}

function unshrink(input) {
    console.log(`unshrink input: ${input}`)
    
    let output = isDECompressed(input) ?  unshrinkDE(input) : unshrinkRLE(input)
    
    console.log(`unshrink output: ${output}`)
    return output
}

function shrinkRLE(input){
    console.log('performing run-length encoding...')

    let output = [];
    while(input.length > 0) {
        let count = 1
        for(let i=1; i<input.length && input[0] === input[i]; i++){
            count++

            if(count >= 255) break
        }
        output.push(count)
        output.push(input[0])
        input = input.slice(count)
    }

    return output;
}

function unshrinkRLE(input){
    console.log('performing run-length encoding...')
   
    let output = [];
    for(let i=0; i< input.length; i += 2){
        let count = input[i] -1
       
        while(count >= 0){
            output.push(input[i+1])
            count--
        }
    }
    return output;
}

function shrinkDE(input){
    console.log('performing delta-encoding...')
    
    let output = [];
    let last = 0
    for(let i = 0; i < input.length; i++){
        let current = input[i]
        output.push(current - last)
        last = current
    }
    output = shrinkRLE(output)

    // adds ~^ symbol at the start to indicate that it was compressed using delta-encoding
    output.unshift(94) // ^
    output.unshift(126) // ~
    return output
}

function unshrinkDE(input){
    console.log('performing delta-encoding...')
    input.shift()
    input.shift()

    input = unshrinkRLE(input)
    let output = [];
    let next = 0

    for(let i = 0; i < input.length; i++){
        let delta = input[i]
        next = delta + next
        output.push(next)
    }
    return output
}

function isSequential(input){
    for(let i = 0; i < input.length-1; i++){
        if(input[i+1] < input[i]) return false
    }
    return true
}

// check if input starts with ~^ symbol
function isDECompressed(input){
    if(input[0] === 126 && input[1] === 94) return true
    return false
}