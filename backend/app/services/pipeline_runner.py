from datetime import datetime


def run_pipeline_mock(run_id: str) -> dict:
    return {
        "run_id": run_id,
        "pipeline": [
            "pre_filter",
            "relevance_analysis",
            "label_classify",
            "sentiment_analysis",
        ],
        "status": "completed",
        "finished_at": datetime.utcnow().isoformat(),
    }
