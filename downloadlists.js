import fetch from "node-fetch";
import fs from "fs";

(async () => {
  let allPages = [];
  let allProblems = [];

  let validProblem = (problem) =>
    problem.includes("Problems/Problem") &&
    problem.match(/^\d{4}/) &&
    problem.match(/\d+$/);

  let computeTest = (problem) =>
    problem
      .match(/(\d{4} )(.*)( Problems)/)[2]
      .replace(/AMC ((?:10)|(?:12))[AB]/, "AMC $1")
      .replace(/AIME I+/, "AIME")
      .replace(/AJHSME/, "AMC 8");
  let computeYear = (problem) => problem.match(/^\d{4}/)[0];
  let computeNumber = (problem) => problem.match(/\d+$/)[0];

  let sortProblems = (problems) =>
    problems.sort(
      (a, b) =>
        Math.sign(computeYear(a) - computeYear(b)) ||
        computeTest(a).localeCompare(computeTest(b)) ||
        Math.sign(computeNumber(a) - computeNumber(b))
    );

  console.log("Preloading all wiki pages, allow around 15 seconds...");
  let apiEndpoint = "https://artofproblemsolving.com/wiki/api.php";
  let params = `action=query&list=allpages&aplimit=max&format=json`;
  let paramsContinue;

  let response = await fetch(`${apiEndpoint}?${params}&origin=*`);
  let json = await response.json();

  for (let page of json.query.allpages) {
    if (page.title.charAt(0) !== "/") allPages.push(page.title);
    if (validProblem(page.title)) allProblems.push(page.title);
  }

  while (json?.continue) {
    console.log(`${Math.round((allPages.length / 14000) * 100)}% loaded...`);
    paramsContinue = params + `&apcontinue=${json.continue.apcontinue}`;
    response = await fetch(`${apiEndpoint}?${paramsContinue}&origin=*`);
    json = await response.json();

    for (let page of json.query.allpages) {
      if (page.title.charAt(0) !== "/") allPages.push(page.title);
      if (validProblem(page.title)) allProblems.push(page.title);
    }
  }

  console.log(`Finished loading Special:AllPages (${allPages.length} pages).`);

  allProblems = sortProblems(allProblems);

  try {
    fs.writeFileSync(
      "data/allpages.json",
      JSON.stringify(allPages, undefined, 2)
    );
  } catch (err) {
    console.error(err);
  }
  try {
    fs.writeFileSync(
      "data/allproblems.json",
      JSON.stringify(allProblems, undefined, 2)
    );
  } catch (err) {
    console.error(err);
  }
})();
