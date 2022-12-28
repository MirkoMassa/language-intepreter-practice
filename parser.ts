import fs from 'fs';
/*
Some html parsing reasoning:

    <div width=700><p class="asdf">"Quote from famous person" -- famous guy</p></div>
    <div id="foo"><p class="asdf">"Quote from famous person" -- famous guy</p></div>
    /<(\w+)( \w+=[A-Za-z"0-9])>/   //breaksdown quickly
    https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form
    TAG := '<' + TAGNAME + ATTRIBUTES + '> + (TAG | TEXT)? + '<' + '/' + TAGNAME + '>'
    ATTRIBUTES := IDENTIFIER + '=' + VALUE
    VALUE := '"' + [^"]*  + '"' | \d+ 
    TEXT = \w+

Generalized parser has three steps:
    take in a string,
    tokenize the strings (breaking them up into pieces),
    running the pieces throught the grammar and checking the match of the grammar

Some resources:
    https://en.wikipedia.org/wiki/LR_parser
    https://en.wikipedia.org/wiki/LL_grammar
    https://en.wikipedia.org/wiki/Recursive_descent_parser
    https://en.wikipedia.org/wiki/Parser_combinator
 
api for automated parser creation in js (will not use that, I need to learn how to parse):
    https://www.npmjs.com/package/jison
*/

// elements are operations "id" (define, operations, loops...), strings "str" or numbers "num"
type element = {
    type: "str" | "id",
    value : string
} | {
    type: "num",
    value: number
}

// parsed subroutine (simple operations and functions)
type subroutine = {
    type: "operation",
    operator:element | subroutine,
    // can contain multiple parsed subroutines or elements
    args: element[]
}
//loops and statements
type other = {
    type: "statement",
    operation:element[], //break of a loop, condition of an if
    operator:element | other, //if, else, while, for, .......
    args: subroutine[]
}

//global variable to check if the main parsing has been used at least 1 time
//I NEED TO REMEMBER TO REASSIGN THIS AFTER EVERY ROW (probably there is a better way to do all of this)
let firstcheck = true;

//regex check of every part of the unparsed subroutine
function mainParsing(subroutine:string) {
    let match, result:element;
    subroutine = (spaceRemover(subroutine)); // unparsed subroutine without spaces

    console.log("current check ", subroutine)

    if(firstcheck){ //id (first occurrence)
        if(match = /^\w[^\s(,#"]+/.exec(subroutine)){ 
            result = {type: "id", value: match[0]};
            console.log("matched id: ", result);
            firstcheck = false;
            //if there are at least 2 parenthesis
            if(/\(.*\(/.exec(subroutine)) return parseStatements(result, subroutine.slice(match[0].length))
            else return parseParenthesis(result, subroutine.slice(match[0].length))
        } 
    }

    if(match = /^\d+\b/.exec(subroutine)){ //number
        console.log("matched num: ", match);
        return result = {type: "num", value: parseInt(match[0])};
    } 
    else if(match = /^[^\s(),#"]+/.exec(subroutine)){ //string
        result = {type: "str", value: match[0]};
        console.log("matched string: ", result);
        return result = {type: "str", value: match[0]};
    } 
    //syntax error
    else throw new SyntaxError("syntax error");
}


function parseParenthesis(element:element | subroutine, values:string){

    parenthesisCheck(values);
    values = values.replace("(", "");
    // converting the element into a subroutine
    element = {type:"operation", operator: element, args: []};
    while(values[0] != ')'){ // closing round bracket is the end of the operation
        
        if (values[0] == ",") values = values.slice(1);
        let res:element = mainParsing(values) as element;
        element.args.push(res);
        if(res.type == "str") values = values.slice(res.value.length)
        else if(res.type == "num") values = values.slice(res.value.toString().length+1)
        

        //should check for that even before the loop 
        if(values[0] == ";") break; //idk about that, it ends the loop when it closes the round bracket
    }
    firstcheck = true;
    return element;
}

function parseStatements(element:element | other, values:string){
    parenthesisCheck(values);

    element = {type:"statement", operation:[], operator: element, args: []};
    values = values.replace("(", ""); 
    values = values.replace("(", ""); 
    console.log("values",values);

    //checking statement conditions (<>==!= || && ...)
    while(values[0] != ')'){ // closing round bracket is the end of the operation
        
        if (values[0] == ",") values = values.slice(1);
        console.log(firstcheck)
        let res:element = mainParsing(values) as element;
        element.operation.push(res);
        if(res.type == "str") values = values.slice(res.value.length)
        else if(res.type == "num") values = values.slice(res.value.toString().length+1)
    }

    //check for each line until there is a closing round bracket
    //need to think about it
    firstcheck = true;
    return element;
}

function parenthesisCheck(values:string){
    if(values[0] != '('){
        throw new SyntaxError("Expected '(' ");
    }
    if(!values.includes(')')){
        throw new SyntaxError("Expected ')' ");
    }
}
function spaceRemover(string:string):string{
    if(string.search(/\s/) == -1) return string;
    return spaceRemover(string.replace(/\s/, ""));
}


export function parse(dir:string){
    let output:subroutine | other[] = [];
    const file = fs.readFileSync(dir, 'utf-8').split('\r\n')
    
    file.forEach(line =>{
        if(!/^\s*$/.exec(line)){ //skipping empty lines
            console.log("execution",line)
            let res = mainParsing(line);
            console.log(res)
        }
        
    })
    
}

parse('./example.txt')