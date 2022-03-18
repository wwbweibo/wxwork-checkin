use mysql::*;

pub struct Connector {
    pub conn: PooledConn,
}

impl Connector {
    pub fn new(url: &str) -> Result<Connector> {
        let opt = Opts::from_url(url).unwrap();
        let pool = Pool::new(opt)?;
        let conn = pool.get_conn()?;
        Ok(Connector { conn: conn})
    }
}
