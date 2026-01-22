"""
Data model definitions for Ajax Radio Dashboard
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional
from enum import Enum


class ContentType(Enum):
    """Content type enumeration"""
    LIVE = "Live"
    PODCAST = "Podcast"
    REPLAY = "Replay"
    ARCHIVE = "Archive"
    UNKNOWN = "Unknown"


@dataclass
class DailyListenerStats:
    """Daily listener statistics from the API"""
    date: str  # ISO 8601 format: "2026-01-20"
    listeners: int
    source: str = "api"
    fetched_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.fetched_at is None:
            self.fetched_at = datetime.now()


@dataclass
class ShowMetadata:
    """Show metadata from Google Sheet"""
    show_id: str
    date: str  # ISO 8601 format: "2026-01-20"
    show_name: str
    duration_minutes: Optional[float] = None
    content_type: Optional[str] = None
    labels: List[str] = field(default_factory=list)
    host: Optional[str] = None
    description: Optional[str] = None
    source: str = "google_sheet"
    updated_at: Optional[datetime] = None
    
    def __post_init__(self):
        if self.updated_at is None:
            self.updated_at = datetime.now()
    
    @property
    def content_type_enum(self) -> ContentType:
        """Convert content_type string to enum"""
        if not self.content_type:
            return ContentType.UNKNOWN
        try:
            return ContentType(self.content_type)
        except ValueError:
            return ContentType.UNKNOWN


@dataclass
class EnrichedShow:
    """Combined and enriched show record"""
    # From API
    date: str
    listeners: int
    
    # From Google Sheet
    show_id: Optional[str] = None
    show_name: Optional[str] = None
    duration_minutes: Optional[float] = None
    content_type: Optional[str] = None
    labels: List[str] = field(default_factory=list)
    host: Optional[str] = None
    description: Optional[str] = None
    
    # Computed fields
    listeners_per_minute: Optional[float] = None
    day_of_week: Optional[str] = None
    month: Optional[str] = None
    year: Optional[int] = None
    week_number: Optional[int] = None
    
    # Metadata
    data_completeness: str = "api_only"  # "full", "api_only", "sheet_only"
    last_updated: Optional[datetime] = None
    
    def __post_init__(self):
        """Calculate derived fields"""
        from datetime import datetime as dt
        
        if self.last_updated is None:
            self.last_updated = datetime.now()
        
        # Parse date and extract time components
        try:
            date_obj = dt.fromisoformat(self.date.replace('T00:00:00', ''))
            self.day_of_week = date_obj.strftime('%A')
            self.month = date_obj.strftime('%B')
            self.year = date_obj.year
            self.week_number = date_obj.isocalendar()[1]
        except (ValueError, AttributeError):
            pass
        
        # Calculate listeners per minute
        if self.duration_minutes and self.duration_minutes > 0:
            self.listeners_per_minute = self.listeners / self.duration_minutes
        
        # Determine data completeness
        has_api_data = self.listeners > 0
        has_sheet_data = self.show_id is not None and self.show_name is not None
        
        if has_api_data and has_sheet_data:
            self.data_completeness = "full"
        elif has_api_data:
            self.data_completeness = "api_only"
        elif has_sheet_data:
            self.data_completeness = "sheet_only"
    
    @classmethod
    def from_api_and_sheet(
        cls,
        api_data: DailyListenerStats,
        sheet_data: Optional[ShowMetadata] = None
    ) -> 'EnrichedShow':
        """Create EnrichedShow from API and optional sheet data"""
        if sheet_data:
            return cls(
                date=api_data.date,
                listeners=api_data.listeners,
                show_id=sheet_data.show_id,
                show_name=sheet_data.show_name,
                duration_minutes=sheet_data.duration_minutes,
                content_type=sheet_data.content_type,
                labels=sheet_data.labels,
                host=sheet_data.host,
                description=sheet_data.description,
            )
        else:
            return cls(
                date=api_data.date,
                listeners=api_data.listeners,
            )


# Example usage and helper functions

def create_daily_stats_from_api(date: str, listeners: int) -> DailyListenerStats:
    """Helper to create DailyListenerStats from API response"""
    return DailyListenerStats(
        date=date,
        listeners=listeners
    )


def create_show_metadata_from_sheet(
    show_id: str,
    date: str,
    show_name: str,
    duration_minutes: Optional[float] = None,
    content_type: Optional[str] = None,
    labels: Optional[List[str]] = None,
    host: Optional[str] = None,
    description: Optional[str] = None
) -> ShowMetadata:
    """Helper to create ShowMetadata from Google Sheet row"""
    return ShowMetadata(
        show_id=show_id,
        date=date,
        show_name=show_name,
        duration_minutes=duration_minutes,
        content_type=content_type,
        labels=labels or [],
        host=host,
        description=description
    )


# Example data structures for reference
EXAMPLE_DAILY_STATS = DailyListenerStats(
    date="2026-01-20",
    listeners=16199
)

EXAMPLE_SHOW_METADATA = ShowMetadata(
    show_id="show_2026_01_20_morning",
    date="2026-01-20",
    show_name="Morning Show",
    duration_minutes=120.0,
    content_type="Live",
    labels=["News", "Sports", "Weather"],
    host="John Doe",
    description="Daily morning program"
)

EXAMPLE_ENRICHED_SHOW = EnrichedShow.from_api_and_sheet(
    EXAMPLE_DAILY_STATS,
    EXAMPLE_SHOW_METADATA
)
