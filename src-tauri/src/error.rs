use serde::Serialize;
use thiserror::Error;

#[derive(Error, Debug, Serialize)]
pub enum AppError {
    #[error("Failed to read config file: {0}")]
    ConfigReadError(String),

    #[error("Failed to write config file: {0}")]
    ConfigWriteError(String),

    #[error("Config file not found: {0}")]
    ConfigNotFound(String),

    #[error("Invalid JSON: {0}")]
    InvalidJson(String),

    #[error("Server not found: {0}")]
    ServerNotFound(String),

    #[error("Server already exists: {0}")]
    ServerExists(String),

    #[error("IO error: {0}")]
    IoError(String),

    #[error("Process error: {0}")]
    ProcessError(String),

    #[error("Timeout error: {0}")]
    TimeoutError(String),

    #[error("Path expansion error: {0}")]
    PathError(String),
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::IoError(err.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::InvalidJson(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
