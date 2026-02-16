Here is a condensed, code-centric documentation reference optimized for an AI agent or LLM context. It focuses on signatures, patterns, strict typing, and implementation details.

---

# Developer Reference: ChatGoogleGenerativeAI (LangChain)

**Package:** `langchain-google-genai` (v4.0.0+)
**Underlying SDK:** `google-genai` (Consolidated Vertex AI and Gemini Developer API)

## 1. Installation & Environment
```bash
pip install -U langchain-google-genai
```

**Authentication Backends (Auto-detected):**
1.  **Gemini Developer API:** Set `GOOGLE_API_KEY` (Recommended for dev).
2.  **Vertex AI:** Set `GOOGLE_APPLICATION_CREDENTIALS` (JSON path) or run `gcloud auth application-default login`.
    *   Optional: Set `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION` (default: `us-central1`).
    *   Force Vertex: Set `GOOGLE_GENAI_USE_VERTEXAI="true"`.

## 2. Initialization & Configuration

```python
from langchain_google_genai import ChatGoogleGenerativeAI, HarmBlockThreshold, HarmCategory

llm = ChatGoogleGenerativeAI(
    model="gemini-3-pro-preview",
    # TEMPERATURE WARNING: Gemini 3.0+ defaults to 1.0. 
    # Do not set to < 0.7 for Gemini 3.0+ to avoid reasoning degradation.
    temperature=1.0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    
    # Proxy Config (Optional)
    client_args={"proxy": "socks5://user:pass@host:port"},
    
    # Safety Settings (Optional)
    safety_settings={
        HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
    }
)
```

## 3. Multimodal Inputs
Gemini models accept text, images, audio, video, and PDFs via the `content` list format.

**Content Block Types:**
*   **Text:** `{"type": "text", "text": "..."}`
*   **Image/Audio/PDF:** `{"type": "image_url", "image_url": "url_or_path"}`
*   **Video:** `{"type": "video", "base64": "...", "mime_type": "video/mp4"}`
*   **File API (Reference):** `{"type": "file", "file_id": "uri", "mime_type": "..."}`

**Usage Example:**
```python
from langchain_core.messages import HumanMessage

message = HumanMessage(
    content=[
        {"type": "text", "text": "Analyze this mix of media."},
        # Image via URL
        {"type": "image_url", "image_url": "https://example.com/image.jpg"},
        # Audio/PDF via URL (treated as image_url key)
        {"type": "image_url", "image_url": "https://example.com/audio.mp3"},
        # Video via Base64
        {
            "type": "video",
            "base64": "<base64_string>",
            "mime_type": "video/mp4"
        }
    ]
)
response = llm.invoke([message])
```

## 4. Thinking Models (Reasoning)
Configuration differs by model family.

**Gemini 3.0+ (Thinking Level):**
```python
llm = ChatGoogleGenerativeAI(
    model="gemini-3-pro-preview",
    thinking_level="high",  # 'minimal', 'low', 'medium', 'high'
    include_thoughts=True   # Returns reasoning in response.content_blocks
)
```

**Gemini 2.5 (Thinking Budget):**
```python
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    thinking_budget=1024,   # Token count (0 to disable, -1 for dynamic)
    include_thoughts=True
)
```

**Accessing Thoughts:**
```python
# If include_thoughts=True
# Usage metadata contains token breakdown
reasoning_tokens = response.usage_metadata["output_token_details"]["reasoning"]
```

## 5. Tool Calling & Built-in Tools

### Custom Tools
Standard LangChain implementation.
```python
@tool
def get_weather(location: str) -> str:
    """Get weather."""
    return "Sunny"

llm_with_tools = llm.bind_tools([get_weather])
```

### Google Built-in Tools
Bind as dictionaries/strings, not functions.

1.  **Google Search:**
    ```python
    llm.bind_tools([{"google_search": {}}])
    ```
2.  **Google Maps:**
    ```python
    llm.bind_tools([{"google_maps": {}}])
    # With Location Context
    llm.bind_tools(
        [{"google_maps": {}}],
        tool_config={
            "retrieval_config": {
                "lat_lng": {"latitude": 48.85, "longitude": 2.29}
            }
        }
    )
    ```
3.  **Code Execution:**
    ```python
    llm.bind_tools([{"code_execution": {}}])
    ```
4.  **Computer Use (Preview):**
    ```python
    from langchain_google_genai import Environment
    llm.bind_tools([{"computer_use": {"environment": Environment.ENVIRONMENT_BROWSER}}])
    ```

## 6. Structured Output
**Method:** `json_schema` is preferred over `function_calling` for reliability.

```python
from pydantic import BaseModel

class ResponseSchema(BaseModel):
    answer: str
    confidence: float

structured_llm = llm.with_structured_output(ResponseSchema, method="json_schema")
```

**⚠️ CRITICAL ANTI-PATTERN:**
Do **not** pass external tools (like Google Search) *inside* the `invoke` of a model configured for `with_structured_output`. The parser will fail if the model attempts to call the tool instead of returning JSON.

**Correct Pattern (Gather then Extract):**
1.  **Gather:** Call standard LLM with tools to get raw text/search results.
2.  **Extract:** Pass raw text to `structured_llm` to parse into Pydantic.

## 7. Media Generation
Some models (`gemini-2.5-flash-image`, `gemini-2.5-flash-preview-tts`) can generate media.

**Image Generation:**
```python
from langchain_google_genai import Modality

# Force image only response
model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-image",
    response_modalities=[Modality.IMAGE]
)
response = model.invoke("Draw a cat")
# URL is in response.content blocks -> image_url -> url
```

**Audio Generation (TTS):**
*Note: May require allowlist on Vertex AI.*
```python
model = ChatGoogleGenerativeAI(model="gemini-2.5-flash-preview-tts")
response = model.invoke("Say hello")
audio_bytes = response.additional_kwargs.get("audio") # Base64 encoded
```

## 8. Thought Signatures (State Management)
Gemini API is stateless. For multi-turn conversations involving **Thinking** or **Tool Calling**, you must preserve the **Thought Signature**.

*   Signatures are stored in `extras` or `additional_kwargs`.
*   **Action:** Always append the actual `AIMessage` object returned by the model to the conversation history list before sending the next `HumanMessage`. Do not manually reconstruct the message string, or the signature (and context) will be lost.