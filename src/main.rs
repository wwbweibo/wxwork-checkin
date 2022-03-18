use actix_web::web;
use actix_web::{get, post, App, HttpResponse, HttpServer, Responder};
use chrono::{prelude::*, Duration};
use chrono_tz::Tz;
use mysql::{params, prelude::Queryable};

mod database;
use database::database::Connector;

mod models;
use models::models::{Holiday, HolidayResponse, HolidayUpdateRequest};

const DATE_FROMAT: &str = "%Y-%m-%d";
const DATETIME_FORMAT: &str = "%Y-%m-%d %H:%M:%S";
const DB_URL: &str = "mysql://root:123456@localhost:3306/holiday";

#[get("/holiday")]
async fn is_holiday() -> impl Responder {
    let now = Utc::now().with_timezone(&chrono_tz::Asia::Shanghai);
    let now_str = now.format(DATE_FROMAT).to_string();
    let result = check_is_holiday(now).await;
    HttpResponse::Ok()
        .content_type("application/json")
        .json(HolidayResponse {
            today: now_str,
            is_holiday: result,
        })
}

#[post("/holiday")]
async fn set_holiday(req: web::Json<Vec<HolidayUpdateRequest>>) -> impl Responder {
    for period in req.iter() {
        add_holiday(period).await;
    }
    HttpResponse::Ok().body("set success")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| App::new().service(is_holiday).service(set_holiday))
        .bind(("0.0.0.0", 9999))?
        .run()
        .await
}

async fn check_is_holiday(date: DateTime<Tz>) -> bool {
    let date_str = date.format(DATE_FROMAT).to_string();
    let mut conn = Connector::new(DB_URL).unwrap();
    let resp = conn
        .conn
        .as_mut()
        .exec_first(
            "select * from holidays where date = :date limit 1",
            params! {"date" => date_str},
        )
        .map(|row| {
            row.map(|(date, is)| HolidayResponse {
                today: date,
                is_holiday: is,
            })
        });
    return match resp {
        Err(e) => !is_workday(date).await,
        Ok(e) => match e {
            Some(data) => data.is_holiday,
            None => !is_workday(date).await,
        },
    };
}

async fn is_workday(date: DateTime<Tz>) -> bool {
    let weekday = date.weekday().num_days_from_monday();
    weekday <= 4
}

async fn add_holiday(info: &HolidayUpdateRequest) -> bool {
    let start = info.range_start.as_str();
    let end = info.range_end.as_str();
    let mut date_start = chrono_tz::Asia::Shanghai
        .datetime_from_str(start, DATETIME_FORMAT)
        .unwrap();
    let date_end = chrono_tz::Asia::Shanghai
        .datetime_from_str(end, DATETIME_FORMAT)
        .unwrap();

    let mut dates: Vec<Holiday> = Vec::new();

    while date_start < date_end {
        dates.push(Holiday {
            date: date_start.format(DATE_FROMAT).to_string(),
            is_holiday: info.is_holiday,
        });
        date_start = date_start.checked_add_signed(Duration::days(1)).unwrap();
    }

    let mut conn = Connector::new(DB_URL).unwrap();
    conn.conn.as_mut().exec_batch(
        "insert into holidays (date, is_holiday) Values(:date, :is_holiday)",
        dates.iter().map(|p| params! {
            "date" => p.date.as_str(),
            "is_holiday" =>  p.is_holiday
        }
        ),
    ).unwrap();

    return true;
}
