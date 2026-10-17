// Points the download buttons at the link in download.json, which scripts/release.py writes. No tracking, no third party.
fetch("download.json", { cache: "no-store" })
  .then((r) => (r.ok ? r.json() : null))
  .then((d) => {
    if (d && d.url) document.querySelectorAll("#dl-button, [data-dl]").forEach((a) => (a.href = d.url));
  })
  .catch(() => {});
