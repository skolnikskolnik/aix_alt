//Dependencies
const mysql = require('mysql');
const inquirer = require('inquirer');

//Connects to database
const connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "password",
    database: "aixTestData"
});


//boiler plate code to connect to db
connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    startPage();
});

//Runs at the start of the page
const startPage = () => {
    //Gets all data from csv file which has been imported into mysql
    connection.query("SELECT*FROM aixtestdata", function (err, results) {
        if (err) throw err;
        let json = makeJSON(results);

        //Get list of all of the advisors - using a set because we don't want to add repeats
        let advisorArray = new Set();
        for (let i = 0; i < json.length; i++) {
            let individualAdvisor = json[i].ADVISOR;
            advisorArray.add(individualAdvisor);
        }
        advisorArray = Array.from(advisorArray);

        //Prompts the user for the advisor they want to see and what type of report
        inquirer
            .prompt([
                {
                    name: "advisor",
                    type: "list",
                    message: "Which advisor would you like to see a summary for?",
                    choices: function () {
                        let choicesArray = [];
                        for (let i = 0; i < advisorArray.length; i++) {
                            choicesArray.push(advisorArray[i]);
                        }
                        return choicesArray;
                    }
                },
                {
                    name: "typeOfReport",
                    type: "list",
                    message: "What type of report would you like?",
                    choices: ["year to date", "month to date", "quarter to date", "inception to date", "end program"]
                }
            ])
            .then(function (answer) {
                let advisorSelected = answer.advisor;
                let reportType = answer.typeOfReport;

                if (reportType == "year to date") {
                    //Gets todays year in a 2 digit string 
                    let todayDate = getYear();

                    let cashTotal = 0;
                    for (let i = 0; i < json.length; i++) {
                        let dateString = json[i].TXN_DATE;
                        dateString = dateString.split("/");
                        let yearString = dateString[2];

                        if ((yearString == todayDate) && (json[i].ADVISOR == advisorSelected)) {
                            let priceString = returnMoneyValue(json[i].TXN_PRICE);
                            cashTotal += priceString;
                        }
                    }

                    restartProgram(cashTotal, advisorSelected);

                } else if (reportType == "month to date") {

                    let month = new Date();
                    month = month.getMonth();
                    //Adding one as the csv file uses standard 1, 2, 3... for the months and doesn't start at 0
                    month += 1;
                    month = month.toString();

                    let year = getYear();

                    let cashTotal = 0;
                    for (let i = 0; i < json.length; i++) {
                        let dateString = json[i].TXN_DATE;
                        dateString = dateString.split("/");
                        let yearString = dateString[2];
                        let monthString = dateString[0];

                        if ((month == monthString) && (year == yearString) && (json[i].ADVISOR == advisorSelected)) {
                            let priceString = returnMoneyValue(json[i].TXN_PRICE);
                            cashTotal += priceString;
                        }
                    }

                    restartProgram(cashTotal, advisorSelected);

                } else if (reportType == "quarter to date") {
                    //q1 jan 1 - march 31, q2 april 1 - june 30, third quarter 1 july = 30 september, 4th quarter 1 oct - 31 dec
                    let month = new Date();
                    month = month.getMonth();
                    month = month + 1;

                    ///This is the quarter we are in
                    let quarter = pickQuarter(month);

                    //Iterates through results and adds to cashtotal if the quarters match
                    let cashTotal = 0;

                    for (let i = 0; i < json.length; i++) {
                        let dateString = json[i].TXN_DATE;
                        dateString = dateString.split("/");
                        let monthString = dateString[0];
                        monthString = parseInt(monthString);
                        let dateQuarter = pickQuarter(monthString);

                        //If the quarter of the row is the same as the quarter we are currently in, add it to the cashTotal
                        if ((dateQuarter == quarter) && (json[i].ADVISOR == advisorSelected)) {
                            let priceString = returnMoneyValue(json[i].TXN_PRICE);
                            cashTotal += priceString;
                        }
                    }

                    restartProgram(cashTotal, advisorSelected);
                    
                } else if (reportType == "inception to date"){

                    //Add together all of the values from that advisor
                    let cashTotal = 0;
                    for (let i = 0; i < json.length; i++) {
                        //If the advisor matches the one chosen 
                        if (json[i].ADVISOR == advisorSelected) {
                            let priceString = returnMoneyValue(json[i].TXN_PRICE);
                            cashTotal += priceString;
                        }
                    }

                    restartProgram(cashTotal, advisorSelected);
                }
                else {
                    //Ends the program
                    connection.end();
                }
            })
    });
}

// Takes the results from sql queries and makes them ordinary json
const makeJSON = data => {
    let string = JSON.stringify(data);
    let json = JSON.parse(string);
    return json;
}

//Returns the current year as a 2 digit string
const getYear = () => {
    let todayDate = new Date().getFullYear();
    todayDate = todayDate.toString();
    todayDate = todayDate.substring(2);
    return todayDate;
}

//Returns the quarter (1,2,3,4) based on a number input
const pickQuarter = num => {
    let quarter = 0;
    if (num <= 3) {
        quarter = 1;
    } else if (num > 3 && num <= 6) {
        quarter = 2;
    } else if (num > 6 && num <= 9) {
        quarter = 3;
    } else {
        quarter = 4;
    }

    return quarter;
}

//Takes in the $ value to display and the advisor's name to display, then restarte the program
const restartProgram = (cashValue, advisorName) => {
    cashValue = cashValue.toFixed(2);
    console.log(`Sales for ${advisorName}: ${cashValue}`);
    console.log("RESTARTING PROGRAM");
    startPage();
}

//Takes the price as a string, removes the dollar sign, and returns a number that can be used for calculations (adding)
const returnMoneyValue = value => {
    value = value.substring(1);
    value = parseFloat(value);

    return value;
}





