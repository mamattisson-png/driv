"""Data som inte kan sparas lokalt går fortfarande att exportera."""
import json
from pathlib import Path

import pytest
from playwright.sync_api import expect

from conftest import go, start
from test_app import add_to


@pytest.mark.parametrize("error_name", ["QuotaExceededError", "SecurityError"])
def test_lokalt_sparfel_visas_tills_loggen_kan_sparas(page, error_name):
    page.clock.install()
    start(page)
    go(page, "kost")
    add_to(page, 1)
    page.fill("#fname", "1 banan")
    page.evaluate("""errorName => {
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) {
        if (this === localStorage && key === KEY) throw new DOMException("Sparfel", errorName);
        return setItem.call(this, key, value);
      };
      window.restoreLogStorage = () => { Storage.prototype.setItem = setItem; };
    }""", error_name)

    page.click("[data-addfood]")
    warning = page.get_by_role("alert").filter(has_text="kunde inte sparas på enheten")
    expect(warning).to_be_visible(timeout=1000)
    page.click("#nav [data-tab=idag]")
    page.clock.fast_forward(2000)
    expect(warning).to_be_visible()
    with page.expect_download() as download:
        page.get_by_role("button", name="Exportera en kopia").click()
    log = json.loads(Path(download.value.path()).read_text(encoding="utf-8"))["log"]
    assert [item["name"] for day in log.values() for item in day["food"]] == ["Banan"]
    expect(warning).to_be_visible()

    page.evaluate("restoreLogStorage()")
    page.click("#nav [data-tab=kost]")
    expect(warning).to_have_count(0)
    page.reload()
    assert page.evaluate("day().food.map(item => item.name)") == ["Banan"]
