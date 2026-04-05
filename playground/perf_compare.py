from __future__ import annotations

from statistics import mean
from time import perf_counter
from typing import Callable

from pydantic import BaseModel


class Item(BaseModel):
    id: int
    title: str
    done: bool
    priority: int
    score: float


class BatchItem(BaseModel):
    items: list[Item]

    def __len__(self) -> int:
        return len(self.items)


def dump_with_list_comprehension(models: list[Item]) -> list[dict[str, object]]:
    return [model.model_dump() for model in models]


def dump_with_single_model_dump(models: BatchItem) -> list[dict[str, object]]:
    return models.model_dump()["items"]


def build_models(n: int) -> list[Item]:
    return [
        Item(
            id=i,
            title=f"task-{i}",
            done=(i % 3 == 0),
            priority=i % 5,
            score=i * 0.01,
        )
        for i in range(n)
    ]


def benchmark(
    name: str,
    fn: Callable[[list[Item]], list[dict[str, object]]],
    models: list[Item],
    repeats: int = 5,
) -> tuple[str, float, float]:
    durations: list[float] = []
    for _ in range(repeats):
        start = perf_counter()
        dumped = fn(models)
        end = perf_counter()
        durations.append(end - start)

        if len(dumped) != len(models):
            raise RuntimeError(f"{name} 输出数量不一致")

    return name, min(durations), mean(durations)


def main() -> None:
    n = 100_000
    repeats = 7

    models = build_models(n)
    batchmodel = BatchItem(items=models)

    # 结果一致性校验
    dump_a = dump_with_list_comprehension(models)
    dump_b = dump_with_single_model_dump(batchmodel)
    if dump_a != dump_b:
        raise RuntimeError("两种方式输出不一致，无法比较性能")

    result_a = benchmark(
        "列表推导式 model_dump", dump_with_list_comprehension, models, repeats
    )
    result_b = benchmark(
        "单个模型循环 model_dump", dump_with_single_model_dump, batchmodel, repeats
    )

    print(f"数据量: {n:,}")
    print(f"重复次数: {repeats}")
    print("-" * 60)
    print(f"{result_a[0]:<28} 最快: {result_a[1]:.6f}s  平均: {result_a[2]:.6f}s")
    print(f"{result_b[0]:<28} 最快: {result_b[1]:.6f}s  平均: {result_b[2]:.6f}s")
    print("-" * 60)

    faster = result_a if result_a[2] < result_b[2] else result_b
    slower = result_b if faster is result_a else result_a
    ratio = slower[2] / faster[2]
    print(f"结论: {faster[0]} 更快，平均约快 {ratio:.2f}x")


if __name__ == "__main__":
    main()
