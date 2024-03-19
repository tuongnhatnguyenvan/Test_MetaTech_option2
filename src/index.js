const express = require('express')
const morgan = require('morgan')
const path = require('path')
const { engine, create } = require('express-handlebars');
const hbs = create({ extname: ".hbs" });
const app = express()
const port = 3000
const puppeteer = require("puppeteer");


app.use(morgan('combined'))
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources/views'));
// console.log('PATH:' , path.join(__dirname, 'views'));

app.get("/test", async (req, res) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(
    "https://listverse.com/2024/03/14/ten-strange-but-true-geography-facts/"
  );

  const fetchDetails = await page.evaluate(() => {
    const parentContent = document.querySelector(".single-article-only");
    const subContent = parentContent.querySelector("#articlecontentonly");
    const title = parentContent.querySelector("h1").textContent;

    const h2s = Array.from(subContent.querySelectorAll("h2"));
    const idVideos = Array.from(subContent.querySelectorAll(".pL"));

    const videos = idVideos.map((video) => video.getAttribute("id").slice(5));
    const subTitles = h2s.map((h2) => h2.textContent);

    const blogContents = {
      title: title,
      introContent: [],
      contents: [],
    };

    let elementContents = { subTitles: "", idVideo: "", array: [] };

    for (
      let tagP = subContent.querySelector("p");
      tagP;
      tagP = tagP.nextElementSibling
    ) {
      if (
        tagP.tagName === "P" ||
        (tagP.tagName === "p" && tagP.classList === undefined)
      ) {
        if (tagP.textContent.length > 100) {
          elementContents.array.push(tagP.textContent);
        } else {
          if (elementContents.array.length > 0) {
            elementContents.array.forEach((element) => {
              blogContents.introContent.push(element);
            });
            elementContents.array = [];
          }
          continue;
        }
        const aTag = tagP.querySelector("a");
        if (aTag) {
          elementContents.subTitles = subTitles.shift();
          elementContents.idVideo = videos.shift();
          blogContents.contents.push(elementContents);
          elementContents = { subTitles: "", idVideo: "", array: [] };
        }
      }
    }
    return blogContents;
  });

  let data = fetchDetails;
  await browser.close();

  res.render("home", { data: data });
});

app.listen(port, () => {
  console.log(`My app listening on port : http://localhost:${port}`)
})