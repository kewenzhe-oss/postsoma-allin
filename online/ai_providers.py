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


def resolve_endpoint(provider_info: dict, model: str, base_url: str | None) -> tuple[str, str]:
    protocol = provider_info.get('protocol', 'openai')
    endpoint = base_url or provider_info.get('base_url')
    if not endpoint:
        raise ValueError('No base_url configured for this provider and no custom base_url provided.')
    endpoint = endpoint.rstrip('/')
    if base_url and protocol == 'openai' and not endpoint.endswith('/chat/completions'):
        endpoint += '/chat/completions' if endpoint.endswith('/v1') else '/v1/chat/completions'
    elif base_url and protocol == 'gemini' and ':generateContent' not in endpoint:
        endpoint += '/models/{model}:generateContent' if endpoint.endswith('/v1beta') else '/v1beta/models/{model}:generateContent'
    return endpoint.replace('{model}', model), protocol
