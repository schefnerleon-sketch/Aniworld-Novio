// ================================================================
// AniWorld Provider — Fixed & Improved for Nuvio (DE / EN / JA)
// Domain: aniworld.to
// ================================================================

var TMDB_KEY = "d80ba92bc7cefe3359668d30d06f3305";
var BASE     = "https://aniworld.to";
var UA       = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function httpGet(url, extraHeaders) {
  var headers = Object.assign({ "User-Agent": UA }, extraHeaders || {});
  return fetch(url, { headers: headers }).then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.text();
  });
}

// Wandelt einen Anime-Titel in ein AniWorld-URL-Slug um
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getStreams(tmdbId, mediaType, season, episode) {
  return new Promise(function (resolve) {
    var tmdbUrl = "https://api.themoviedb.org/3/" +
      (mediaType === "movie" ? "movie" : "tv") +
      "/" + tmdbId + "?api_key=" + TMDB_KEY;

    fetch(tmdbUrl)
      .then(function (r) { return r.json(); })
      .then(function (meta) {
        var title = meta.name || meta.title || meta.original_name;
        if (!title) throw new Error("Kein Titel von TMDB gefunden");

        var slug = slugify(title);
        var ep = episode || 1;
        var s = season || 1;

        // AniWorld URL-Muster: https://aniworld.to/anime/stream/{slug}/staffel-{s}/episode-{ep}
        var pageUrl = BASE + "/anime/stream/" + slug + "/staffel-" + s + "/episode-" + ep;

        return httpGet(pageUrl, { Referer: BASE + "/" }).then(function (html) {
          var streams = [];

          // Extrahiere Hoster-Links aus der Episodenseite
          var re = /data-link-target="([^"]+)"/g;
          var match;
          var hosters = [];

          while ((match = re.exec(html)) !== null) {
            hosters.push(match[1]);
          }

          if (hosters.length === 0) {
            var altRe = /href="(\/redirect\/\d+)"/g;
            while ((match = altRe.exec(html)) !== null) {
              hosters.push(BASE + match[1]);
            }
          }

          // Generiere Stream-Einträge für Nuvio
          for (var i = 0; i < hosters.length; i++) {
            var redirectUrl = hosters[i].startsWith("http") ? hosters[i] : BASE + hosters[i];

            streams.push({
              name: "AniWorld • German / Sub",
              title: "AniWorld Stream #" + (i + 1),
              url: redirectUrl,
              quality: "1080p",
              headers: {
                "User-Agent": UA,
                "Referer": BASE + "/"
              },
              provider: "aniworld"
            });
          }

          return streams;
        });
      })
      .then(function (streams) {
        resolve(streams || []);
      })
      .catch(function (err) {
        console.error("[AniWorld Error]", err && err.message ? err.message : err);
        resolve([]);
      });
  });
}

// Export für Nuvio
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams: getStreams };
} else {
  global.getStreams = getStreams;
}
