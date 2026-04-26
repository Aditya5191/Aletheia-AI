import os
from pathlib import Path
from fastmcp import FastMCP

# Create MCP server instance
mcp = FastMCP("MiscellaneousServer")

@mcp.tool()
def get_chart_schemas(reason: str = "") -> str:
    """
    Get the JSON data schema structures required to render different types of 
    charts (Bar, Grouped Bar, Stacked Bar, Line, Scatter, Box-Plot, Heatmap, Waterfall) 
    in the frontend visualization engine.
    
    Args:
        reason: CRITICAL: MAXIMUM 5 WORDS. Describe what you are trying to achieve. E.g., 'Fetching chart schema formats'.
    """
    base_dir = Path(__file__).resolve().parent
    file_path = base_dir / "chart_schemas.txt"
    try:
        return file_path.read_text(encoding='utf-8')
    except FileNotFoundError:
        return f"Error: {file_path} not found."
    except Exception as e:
        return f"Error reading schemas: {e}"

if __name__ == "__main__":
    port = os.environ.get("PORT")
    if port:
        # Railway / cloud deployment: run SSE transport over HTTP
        mcp.run(transport="sse", host="0.0.0.0", port=int(port))
    else:
        # Local: run stdio transport (Claude Desktop, Cursor)
        mcp.run()
