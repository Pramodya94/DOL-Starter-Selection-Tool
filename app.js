require('dotenv').config();
const express = require("express");
const ejs = require('ejs');
const bodyParser = require("body-parser");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

let results = {
  nominalCurrent: 0,
  inrush3: 0,
  inrush4: 0,
  inrush5: 0,
  inrush7: 0,
  cbSelection: ""
}

const mcb = [2, 6, 10, 16, 20, 25, 32, 40, 63];
const mccb = [16, 25, 32, 40, 63, 80, 100, 125, 160, 200, 250, 400, 630, 800, 1000];
const contactor = [{
  kw: 4,
  amp: 9
}, {
  kw: 5.5,
  amp: 12
}, {
  kw: 11,
  amp: 25
}, {
  kw: 15,
  amp: 32
}, {
  kw: 18.5,
  amp: 38
}, {
  kw: 18.5,
  amp: 40
}, {
  kw: 22,
  amp: 50
}, {
  kw: 30,
  amp: 65
}, {
  kw: 37,
  amp: 80
}, {
  kw: 75,
  amp: 150
}];
const ol = [{
  min: 0.1,
  max: 0.16
}, {
  min: 0.16,
  max: 0.25
}, {
  min: 0.25,
  max: 0.4
}, {
  min: 0.4,
  max: 0.63
}, {
  min: 0.63,
  max: 1
}, {
  min: 1,
  max: 1.7
}, {
  min: 1.6,
  max: 2.5
}, {
  min: 2.5,
  max: 4
}, {
  min: 5.5,
  max: 8
}, {
  min: 7,
  max: 10
}, {
  min: 9,
  max: 13
}, {
  min: 12,
  max: 18
}, {
  min: 16,
  max: 24
}, {
  min: 23,
  max: 32
}]
const olSet2 = [{
  min: 17,
  max: 25
}, {
  min: 23,
  max: 32
}, {
  min: 30,
  max: 40
}, {
  min: 37,
  max: 50
}, {
  min: 48,
  max: 65
}, {
  min: 55,
  max: 70
}, {
  min: 63,
  max: 80
}, {
  min: 80,
  max: 104
}, {
  min: 95,
  max: 120
}, {
  min: 110,
  max: 140
}]

function mccbCalc() {
  for (let k = 0; k < mccb.length; k++) {
    if (mccb[k] < results.inrush3 && mccb[k + 1] >= results.inrush3) {
      return lowerMcb = mccb[k + 1];
    }

    if (mccb[k] < results.inrush5 && mccb[k + 1] >= results.inrush5) {
      return upperMcb = mccb[k + 1];
    }
  }
}

app.get("/", function(req, res) {
  results.nominalCurrent = 0;
  res.render("calculator", results);
});

app.get("/contactMe", function(req, res) {
  res.sendFile(__dirname + "/contact.html");
});

app.post("/", function(req, res) {
  const ph = Number(req.body.phase);
  let p = Number(req.body.power);
  const unit = Number(req.body.powerUnit);
  const pf = Number(req.body.pf);
  const eff = Number(req.body.eff);
  let iNominal = 0;
  let voltage = 0;
  let threePhase = 0;
  let mcbPole = 0;
  let mccbPole = 0;

  if (ph === 1) {
    voltage = 400;
    threePhase = Math.sqrt(3);
    mcbPole = 3;
    mccbPole = 3;
  } else if (ph === 2) {
    voltage = 230;
    threePhase = 1;
    mcbPole = 2;
    mccbPole = 3;
  }

  if (unit === 2) {
    p = p * 0.7457;
  }

  iNominal = (p * 1000) / (threePhase * voltage * pf * (eff / 100));
  iNominal = Math.round((iNominal + Number.EPSILON) * 100) / 100;

  if (iNominal === Infinity || isNaN(iNominal) === true) {
    iNominal = 0;
  }


  results.nominalCurrent = iNominal;
  results.olCurrent = Math.round(((iNominal * 1.1) + Number.EPSILON) * 100) / 100;;
  results.inrush3 = Math.round(iNominal * 3);
  results.inrush4 = Math.round(iNominal * 4);
  results.inrush5 = Math.round(iNominal * 5);
  results.inrush7 = Math.round(iNominal * 7);
  let upperMcb = 0;
  let lowerMcb = 0;

  if (mcb[0] >= results.inrush5) {
    if (mcb[0] >= results.inrush7) {
      lowerMcb = mcb[0];
      upperMcb = mcb[0];
    } else {
      for (let j = 0; j < mcb.length; j++) {
        if (mcb[j] < results.inrush7 && mcb[j + 1] >= results.inrush7) {
          lowerMcb = mcb[0];
          upperMcb = mcb[j + 1];
        }
      }

    }
  } else {
    for (let i = 0; i < mcb.length; i++) {
      if (mcb[i] < results.inrush5 && mcb[i + 1] >= results.inrush5) {
        lowerMcb = mcb[i + 1];
      }

      if (mcb[i] < results.inrush7 && mcb[i + 1] >= results.inrush7) {
        upperMcb = mcb[i + 1];
      }
    }
  }



  if (lowerMcb === upperMcb) {

    if (upperMcb === 0) {
      if (mccb[0] >= results.inrush3) {
        lowerMcb = mccb[4];
        upperMcb = mccb[4];
      } else {
        for (let j = 0; j < mccb.length; j++) {
          if (mccb[j] < results.inrush5 && mccb[j + 1] >= results.inrush5) {
            lowerMcb = mccb[4];
            upperMcb = mccb[j + 1];
          } else {
            mccbCalc();
          }
        }

      }
      results.cbSelection = lowerMcb + "A / " + upperMcb + "A " + mccbPole + "P MCCB";

    } else {
      results.cbSelection = upperMcb + "A " + mcbPole + "P C-Curve MCB";
    }
  } else {
    if (upperMcb === 0) {
      for (let k = 0; k < mccb.length; k++) {
        if (mccb[k] < results.inrush3 && mccb[k + 1] >= results.inrush3) {
          upperMcb = mccb[k + 1];
        }
      }
      results.cbSelection = lowerMcb + "A " + mccbPole + "P C-Curve MCB or " + upperMcb + "A " + mccbPole + "P MCCB";

    } else {
      results.cbSelection = lowerMcb + "A / " + upperMcb + "A " + mcbPole + "P C-Curve MCB";
    }

  }
  res.render("calculator", results);

});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000.");
});
