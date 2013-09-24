// TeXworksScript
// Title: LaTeX errors
// Description: Looks for errors in the LaTeX terminal output
// Author: Jonathan Kew & Stefan Löffler
// Version: 0.4
// Date: 2010-11-02
// Script-Type: hook
// Hook: AfterTypeset

// This is just a simple proof-of-concept; it will often get filenames wrong, for example.
// Switching the engines to use the FILE:LINE-style error messages could help a lot.
exports.findErrors = function(output) {

    parenRE = new RegExp("[()]");
// Should catch filenames of the following forms:
// * ./abc, "./abc"
// * /abc, "/abc"
// * .\abc, ".\abc"
// * C:\abc, "C:\abc"
// * \\server\abc, "\\server\abc"
// Caveats: filenames with escaped " or space in the filename don't work (correctly)
    newFileRE = new RegExp("^\\(\"?((?:\\./|/|.\\\\|[a-zA-Z]:\\\\|\\\\\\\\[^\\\" )]+\\\\)[^\" )]+)");
    lineNumRE = new RegExp("^l\\.(\\d+)");
    badLineRE = new RegExp("^(?:Over|Under)full \\\\hbox.*at lines (\\d+)");
    warnLineRE = new RegExp("^(?:LaTeX|Package (?:.*)) Warning: .*");
    warnLineNumRE = new RegExp("on input line (\\d+).");
    errorlineRE = new RegExp("(?=[A-Z])[a-zA-Z0-9/:_.-]{1,}\.[a-zA-Z]{1,3}\:(?=[0-9])[0-9]{1,}\:(?=[ A-Z])[ a-zA-Z0-9/:_.-]{1,}");
    errors = [];
    warnings = [];
    infos = [];

    function trim(zeichenkette) {
        return zeichenkette.replace(/^\s+/, '').replace(/\s+$/, '');
    }

// get the text from the standard console output
    txt = output;
    lines = txt.split('\n');

    curFile = undefined;
    filenames = [];
    extraParens = 0;

    for (i = 0; i < lines.length; ++i) {
        var line = lines[i];
        
        
        // check for error messages
        matched = errorlineRE.exec(line);
        if (matched) {
            var error = {};
            // record the current input file
            error['File'] = (new RegExp("(?=[A-Z])[a-zA-Z0-9/:_.-]{1,}\.[A-Za-z]{1,}\:").exec(matched[0]))[0];
            // record the error message itself
            var test = (new RegExp("\:[0-9]{1,}\:").exec(matched[0]))[0].substr(1);
            error['Line'] = parseInt(test.replace(":",""));
            error['Message'] = matched[0].replace(error['File']+test,"").substr(1);
            debugger;
            // look ahead for the line number and record that
            errors.push(error);
            continue;
        }

        // check for over- or underfull lines
        matched = badLineRE.exec(line);
        if (matched) {
            var error = {};
            error['File'] = curFile;
            error['Line'] = matched[1];
            error['Message'] = line;
            infos.push(error);
            continue;
        }

        // check for other warnings
        matched = warnLineRE.exec(line);
        if (matched) {
            var error = {};
            error['File'] = curFile;
            error['Line'] = "?";
            error['Message'] = line;

            while (++i < lines.length) {
                line = lines[i];
                if (line === '')
                    break;
                error['Message'] += "\n" + line;
            }
            matched = warnLineNumRE.exec(error['Message'].replace(/\n/, ""));
            if (matched)
                error['Line'] = matched[1];
            warnings.push(error);
            continue;
        }

        // try to track beginning/ending of input files (flaky!)
        pos = line.search(parenRE);
        while (pos >= 0) {
            line = line.slice(pos);
            if (line.charAt(0) === ")") {
                if (extraParens > 0) {
                    --extraParens;
                }
                else if (filenames.length > 0) {
                    curFile = filenames.pop();
                }
                line = line.slice(1);
            }
            else {
                match = newFileRE.exec(line);
                if (match) {
                    filenames.push(curFile);
                    curFile = match[1];
                    line = line.slice(match[0].length);
                    extraParens = 0;
                }
                else {
                    ++extraParens;
                    line = line.slice(1);
                }
            }
            if (line === undefined) {
                break;
            }
            pos = line.search(parenRE);
        }
    }
    var outputErrors = {
        errors:errors,
        warns:warnings,
        infos:infos
    };
    
    return outputErrors;
};
