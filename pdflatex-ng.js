var exec = require('child_process').exec
        , fs = require('fs')
        , mkdirp = require('mkdirp')
        , path = require('path')
        , util = require('util')
	, latexErrors = require('./latexErrors').findErrors;

/* Constructor providing some defaults. */
function PDFLatex(inputPath) {
    this.outputDirectory = process.cwd() + "/";
    this.inputPath = inputPath;
}
;

/* Allow changing the output directory. */
PDFLatex.prototype.setOutputDir = function(path) {
    this.outputDirectory = path;
    return this;
};

validateInput = function(input) {
    var rv = {
        "rc": "-1",
        "str": ""
    };

    if (input.length < 1) {
        rv = {
            "rc": "0",
            "str": "Invalid input provided. Empty imput?"
        };
    }

    fs.exists(input, function(exists) {
        if (!exists) {
            rv = {
                "rc": "0",
                "str": "Invalid input provided. Does the file exist?"
            };
        }
    });

    if (rv.rc < 0) {
        rv = {
            "rc": "1",
            "str": undefined
        };
    }

    return rv;
};

validOutputDir = function(dir) {
    var outputDir = dir;
    var rv = {
        "rc": "-1",
        "str": ""
    };

    fs.lstat(outputDir, function(err, stats) {
        if (!err && stats.isDirectory()) {
            rv = {
                "rc": "1",
                "str": ""
            };
        } else if (!err && stats.isFile()) {
            rv = {
                "rc": "0",
                "str": "Cannot write to " + outputDir + ", it is a file"
            };
        } else {
            mkdirp(outputDir, function(err) {
                if (err)
                    console.error(err);
            });
            rv = {
                "rc": "1",
                "str": ""
            };
        }
    });

    if (rv.rc < 0) {
        rv = {
            "rc": "1",
            "str": undefined
        };
    }

    return rv;
};

PDFLatex.prototype.typeset = function(callback) {
    var rvd = validOutputDir(this.outputDirectory);
    if (rvd.rc > 0) {
        var rv = validateInput(this.inputPath);
        if (rv.rc > 0) {
            //pdflatex -output-directory "E:\Dokumente\LatexClient\cache\latex_7" "E:\Dokumente\LatexClient\cache\latex_7\latex.tex"
            var command = 'pdflatex -halt-on-error  -file-line-error -output-directory "' + this.outputDirectory + '" "' + this.inputPath + '"';
            //util.puts(command);
            err = exec(command, function(err, stdout, stderr) {
                callback(err, stdout, latexErrors(stdout));
            });
        } else {
            callback(new Error(rv.str));
        }
    } else {
        callback(new Error(rvd.str));
        //throw new Error(rvd.str);
    }
};

module.exports = PDFLatex;
