PROVIDER_ALLOWLIST = {
    "openai": {
        "base_url": "https://api.openai.com/v1/chat/completions",
        "protocol": "openai"
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com/chat/completions",
        "protocol": "openai"
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1/chat/completions",
        "protocol": "openai"
    },
    "qwen": {
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        "protocol": "openai"
    },
    "gemini": {
        # Gemini uses its own REST endpoint; model is filled in at runtime
        "base_url": "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
        "protocol": "gemini"
    },
    # Generic "custom" provider: caller must supply a base_url
    "custom": {
        "base_url": None,
        "protocol": "openai"
    }
}
