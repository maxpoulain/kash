"""Pure scheduling logic for recurring transactions (no I/O, fully testable)."""

from calendar import monthrange
from datetime import date as Date
from datetime import timedelta


def _days_in_month(year: int, month: int) -> int:
    return monthrange(year, month)[1]


def next_occurrence(current: Date, frequency: str, anchor_day: int) -> Date:
    """Return the occurrence date following ``current``.

    - ``weekly``: 7 days later (keeps the weekday).
    - ``monthly``: same date next month, on ``anchor_day`` clamped to the month
      length. Clamping uses the *intended* ``anchor_day`` each month so a rule on
      day 31 yields 31 → 28 (Feb) → 31 (Mar), never drifting to 28.
    """
    if frequency == "weekly":
        return current + timedelta(days=7)

    year, month = current.year, current.month
    if month == 12:
        year, month = year + 1, 1
    else:
        month += 1
    return Date(year, month, min(anchor_day, _days_in_month(year, month)))


def due_occurrences(
    next_run_date: Date,
    frequency: str,
    anchor_day: int,
    today: Date,
    end_date: Date | None = None,
) -> tuple[list[Date], Date]:
    """Compute occurrence dates to materialize up to and including ``today``.

    Returns ``(occurrence_dates, new_next_run_date)``. Advancing the returned
    next-run date and persisting it makes generation idempotent: calling again
    the same day yields no occurrences.
    """
    occurrences: list[Date] = []
    run = next_run_date
    while run <= today and (end_date is None or run <= end_date):
        occurrences.append(run)
        run = next_occurrence(run, frequency, anchor_day)
    return occurrences, run


def initial_next_run_date(start_date: Date, anchor_day: int, frequency: str) -> Date:
    """First occurrence date for a new rule.

    ``start_date`` is treated as the first occurrence; subsequent runs follow the
    frequency. For monthly rules this normalizes the day to ``anchor_day`` clamped
    to the start month so day 31 starting in February fires on the 28th/29th.
    """
    if frequency == "monthly":
        clamped = min(anchor_day, _days_in_month(start_date.year, start_date.month))
        candidate = Date(start_date.year, start_date.month, clamped)
        # If the anchored day already passed this month, roll to next month.
        if candidate < start_date:
            return next_occurrence(candidate, frequency, anchor_day)
        return candidate
    return start_date
