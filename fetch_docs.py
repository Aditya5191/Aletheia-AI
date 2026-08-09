import asyncio
from playwright.async_api import async_playwright

urls = [
    "https://bob.ibm.com/docs/ide/configuration/mcp/understanding-mcp",
    "https://bob.ibm.com/docs/ide/configuration/mcp/server-transports",
    "https://bob.ibm.com/docs/ide/configuration/mcp/mcp-in-bob",
    "https://bob.ibm.com/docs/ide/configuration/mcp/mcp-oauth",
    "https://bob.ibm.com/docs/ide/features/skills"
]

async def main():
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            with open("bob_docs.txt", "w", encoding="utf-8") as f:
                for url in urls:
                    print(f"Fetching {url}")
                    await page.goto(url)
                    await page.wait_for_timeout(2000) # wait for render
                    text = await page.evaluate("document.body.innerText")
                    f.write(f"=== {url} ===\n{text}\n\n")
            
            await browser.close()
            print("Done!")
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(main())
