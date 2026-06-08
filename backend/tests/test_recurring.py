"""Unit tests for the pure recurring-transaction scheduling logic."""

from datetime import date

from app.services.recurring import (
    due_occurrences,
    initial_next_run_date,
    next_occurrence,
)


# --- next_occurrence ---


def test_next_occurrence_weekly_adds_seven_days():
    assert next_occurrence(date(2026, 6, 1), "weekly", 0) == date(2026, 6, 8)


def test_next_occurrence_monthly_keeps_day():
    assert next_occurrence(date(2026, 6, 5), "monthly", 5) == date(2026, 7, 5)


def test_next_occurrence_monthly_clamps_to_february():
    # Anchor day 31 in January -> Feb 28 (2026 is not a leap year).
    assert next_occurrence(date(2026, 1, 31), "monthly", 31) == date(2026, 2, 28)


def test_next_occurrence_monthly_recovers_intended_day_after_clamp():
    # From the clamped Feb 28, the intended anchor 31 returns on Mar 31.
    assert next_occurrence(date(2026, 2, 28), "monthly", 31) == date(2026, 3, 31)


def test_next_occurrence_monthly_rolls_over_year():
    assert next_occurrence(date(2026, 12, 15), "monthly", 15) == date(2027, 1, 15)


# --- due_occurrences ---


def test_due_occurrences_none_when_next_run_in_future():
    occ, new_next = due_occurrences(
        date(2026, 7, 5), "monthly", 5, today=date(2026, 6, 8)
    )
    assert occ == []
    assert new_next == date(2026, 7, 5)


def test_due_occurrences_single_when_due_today():
    occ, new_next = due_occurrences(
        date(2026, 6, 8), "monthly", 8, today=date(2026, 6, 8)
    )
    assert occ == [date(2026, 6, 8)]
    assert new_next == date(2026, 7, 8)


def test_due_occurrences_catches_up_multiple_periods():
    # Rule due since March, today is June -> Mar, Apr, May, Jun.
    occ, new_next = due_occurrences(
        date(2026, 3, 10), "monthly", 10, today=date(2026, 6, 8)
    )
    assert occ == [date(2026, 3, 10), date(2026, 4, 10), date(2026, 5, 10)]
    assert new_next == date(2026, 6, 10)


def test_due_occurrences_weekly_catch_up():
    occ, new_next = due_occurrences(
        date(2026, 6, 1), "weekly", 0, today=date(2026, 6, 20)
    )
    assert occ == [date(2026, 6, 1), date(2026, 6, 8), date(2026, 6, 15)]
    assert new_next == date(2026, 6, 22)


def test_due_occurrences_stops_at_end_date():
    occ, _ = due_occurrences(
        date(2026, 3, 10),
        "monthly",
        10,
        today=date(2026, 6, 8),
        end_date=date(2026, 4, 30),
    )
    assert occ == [date(2026, 3, 10), date(2026, 4, 10)]


def test_due_occurrences_is_idempotent_after_advance():
    # First pass materializes, second pass (with advanced next_run) yields nothing.
    occ1, new_next = due_occurrences(
        date(2026, 6, 8), "monthly", 8, today=date(2026, 6, 8)
    )
    occ2, _ = due_occurrences(new_next, "monthly", 8, today=date(2026, 6, 8))
    assert occ1 == [date(2026, 6, 8)]
    assert occ2 == []


# --- initial_next_run_date ---


def test_initial_next_run_date_monthly_uses_start_day():
    assert initial_next_run_date(date(2026, 6, 5), 5, "monthly") == date(2026, 6, 5)


def test_initial_next_run_date_monthly_clamps_start_month():
    # Start Feb with anchor 31 -> Feb 28.
    assert initial_next_run_date(date(2026, 2, 1), 31, "monthly") == date(2026, 2, 28)


def test_initial_next_run_date_rolls_when_anchor_already_passed():
    # Start June 20, anchor day 5 already passed this month -> July 5.
    assert initial_next_run_date(date(2026, 6, 20), 5, "monthly") == date(2026, 7, 5)


def test_initial_next_run_date_weekly_is_start_date():
    assert initial_next_run_date(date(2026, 6, 3), 2, "weekly") == date(2026, 6, 3)
