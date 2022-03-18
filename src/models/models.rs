use serde::{Serialize, Deserialize};

#[derive(Serialize)]
#[derive(Deserialize)]
#[derive(Debug)]
pub struct HolidayUpdateRequest {
    pub range_start: String,
    pub range_end: String,
    pub is_holiday: bool
}

#[derive(Serialize)]
pub struct HolidayResponse {
    pub today: String,
    pub is_holiday: bool,
}

pub struct Holiday {
    pub date: String,
    pub is_holiday: bool
}