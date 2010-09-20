/*
Copyright (c) 2010 Walter Tetzner

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// Returns a parser that parses a string
function string(tok)
{
    return function(input)
    {
        if(tok == "")
        {
            return {rest: input,
                    parsed: tok,
                    ast: null};
        }

        if(input.substr(0, tok.length) == tok)
        {
            return {rest: input.substr(tok.length, input.length - tok.length),
                    parsed: tok,
                    ast: tok};
        }
        else
        {
            return false;
        }
    }
}

// Returns a parser that parses a single letter
function letter()
{
    return function(input)
    {
        if(input.charAt(0).search(/[a-zA-Z]/) != -1)
        {
            return {rest: input.substr(1, input.length - 1),
                    parsed: input.charAt(0),
                    ast: input.charAt(0)};
        }
        else
        {
            return false;
        }
    }
}

// Returns a parser that parses a single digit
function digit()
{
    return function(input)
    {
        if(input.charAt(0).search(/[0-9]/) != -1)
        {
            return {rest: input.substr(1, input.length - 1),
                    parsed: input.charAt(0),
                    ast: input.charAt(0)};
        }
        else
        {
            return false;
        }
    }
}

// Returns a parser that parses any character that's not in the input
function noneOf(chars)
{
    return function(input)
    {
        var match = new RegExp('[^' + chars + ']');
        if(input.charAt(0).search(match) != -1)
        {
            return {rest: input.substr(1, input.length - 1),
                    parsed: input.charAt(0),
                    ast: input.charAt(0)};
        }
        else
        {
            return false;
        }
    }
}

// Returns a parser that parses any character that's in the input
function oneOf(chars)
{
    return function(input)
    {
        var match = new RegExp('[' + chars + ']');
        if(input.charAt(0).search(match) != -1)
        {
            return {rest: input.substr(1, input.length - 1),
                    parsed: input.charAt(0),
                    ast: input.charAt(0)};
        }
        else
        {
            return false;
        }
    }
}

// Returns the first successful parse
function or()
{
    var items = arguments;
    return function(input)
    {
        for(var i = 0; i < items.length; i++)
        {
            var result = items[i](input);
            if(result != false)
            {
                return result;
            }
        }
        return false;
    }
}

// Returns a parser that parses 1 or more times using the parser passed in
function many1(parser)
{
    return function(input)
    {
        var value = {rest: input, parsed: '', ast: []};
        for(var i = 0; true; i++)
        {
            var result = parser(value.rest);
            if(result != false)
            {
                if(result.ast != null)
                {
                    value.ast.push(result.ast);
                }
                value = {rest: result.rest,
                         parsed: value.parsed + result.parsed,
                         ast: value.ast};
            }
            else
            {
                if(value.parsed == '')
                {
                    return false;
                }
                else
                {
                    break;
                }
            }
        }
        return value;
    }
}

// Returns a parser that parses 0 or more times using the parser passed in
function many(parser)
{
    return function(input)
    {
        var value = {rest: input, parsed: '', ast: []};
        for(var i = 0; true; i++)
        {
            var result = parser(value.rest);
            if(result != false)
            {
                if(result.ast != null)
                {
                    value.ast.push(result.ast);
                }
                value = {rest: result.rest,
                         parsed: value.parsed + result.parsed,
                         ast: value.ast};
            }
            else
            {
                if(value.parsed == '')
                {
                    value = {rest: value.rest,
                             parsed: '',
                             ast: null};
                }
                break;
            }
        }
        return value;
    }
}

// Returns a parser that runs each parser in order
function and()
{
    var items = arguments;
    return function(input)
    {
        var value = {rest: input, parsed: '', ast: []};
        for(var i = 0; i < items.length; i++)
        {
            var result = items[i](value.rest);
            if(result != false)
            {
                var rst = result.rest;
                if(result.ast != null)
                {
                    value.ast.push(result.ast);
                }
                value = {rest: rst,
                         parsed: value.parsed + result.parsed,
                         ast: value.ast};
            }
            else
            {
                return false;
            }
        }
        return value;
    }
}

// Takes the result of a parser and copies the parsed string to ast
function makeStr(parser)
{
    return function(input)
    {
        var result = parser(input);
        if(result != false)
        {
            if(result.parsed != '')
            {
                return {rest: result.rest,
                        parsed: result.parsed,
                        ast: result.parsed};
            }
            else
            {
                return {rest: result.rest,
                        parsed: result.parsed,
                        ast: null};
            }
        }
        else
        {
            return false;
        }
    }
}

// Returns a parser that parses a list of items separated by a list of other items
function sepBy(parser, separator)
{
    return function(input)
    {
        var obj = {rest: input, parsed: '', ast: []};
        var firstParse = parser(obj.rest);
        if(firstParse == false)
        {
            obj.ast = null;
            return obj;
        }
        obj.ast.push(firstParse.ast);
        obj.rest = firstParse.rest;
        obj.parsed = obj.parsed + firstParse.parsed;

        var rest = (many(and(separator, parser)))(obj.rest);
        if(rest != false)
        {
            if(rest.ast != null)
            {
                for(var i = 0; i < rest.ast.length; i++)
                {
                    obj.ast.push(rest.ast[i][0]);
                    obj.ast.push(rest.ast[i][1]);
                }
            }
            obj.rest = rest.rest;
            obj.parsed = obj.parsed + rest.parsed;
        }

        return obj;
    }
}

// Returns a parser that replaces a parser's ast
function ret(parser, func)
{
    return function(input)
    {
        var result = parser(input);
        if(result != false)
        {
            return {rest: result.rest,
                    parsed: result.parsed,
                    ast: func(result.ast)};
        }
        else
        {
            return false;
        }
    }
}



