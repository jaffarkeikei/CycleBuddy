#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, String, Vec, BytesN, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum AlertType {
    IrregularCycle,
    UnusualSymptoms,
    MedicationReminder,
    AppointmentReminder,
    HealthMetricAnomaly,
    TrendChange,
    PredictedEvent,
}

#[derive(Clone)]
#[contracttype]
pub enum AlertPriority {
    Low,
    Medium,
    High,
    Urgent,
}

#[derive(Clone)]
#[contracttype]
pub enum AlertStatus {
    Active,
    Resolved,
    Dismissed,
    Expired,
}

#[derive(Clone)]
#[contracttype]
pub struct Alert {
    id: BytesN<32>,
    user: Address,
    alert_type: AlertType,
    title: String,
    description: String,
    priority: AlertPriority,
    status: AlertStatus,
    created_at: u64,
    updated_at: u64,
    expires_at: Option<u64>,
    related_data: Option<String>, // JSON string or data reference
}

#[derive(Clone)]
#[contracttype]
pub struct AlertConfig {
    user: Address,
    enabled_types: Vec<AlertType>,
    notification_channels: Vec<String>, // e.g., "email", "push", "sms"
    threshold_overrides: Map<AlertType, i128>,
    is_active: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct HealthMetricThreshold {
    metric_name: String,
    min_value: Option<i128>,
    max_value: Option<i128>,
    unusual_change: Option<i128>, // percentage or absolute change
}

#[derive(Clone)]
#[contracttype]
pub struct TurretConfig {
    name: String,
    endpoint: String,
    api_key: String,
    is_active: bool,
}

#[contract]
pub struct HealthAlertContract {
    admin: Address,
    user_alert_configs: Map<Address, AlertConfig>,
    alerts: Map<BytesN<32>, Alert>,
    user_alerts: Map<Address, Vec<BytesN<32>>>,
    metric_thresholds: Map<String, HealthMetricThreshold>,
    turret_endpoints: Vec<TurretConfig>,
}

#[contractimpl]
impl HealthAlertContract {
    // Initialize the contract
    pub fn initialize(env: Env, admin: Address) -> Self {
        admin.require_auth();
        
        let mut contract = Self {
            admin,
            user_alert_configs: Map::new(&env),
            alerts: Map::new(&env),
            user_alerts: Map::new(&env),
            metric_thresholds: Map::new(&env),
            turret_endpoints: Vec::new(&env),
        };
        
        // Set up default metric thresholds
        contract.setup_default_thresholds(&env);
        
        // Set up default Turret endpoints
        contract.setup_default_turrets(&env);
        
        contract
    }
    
    // Set up default health metric thresholds
    fn setup_default_thresholds(&mut self, env: &Env) {
        // Cycle length threshold
        let cycle_threshold = HealthMetricThreshold {
            metric_name: String::from_str(env, "cycle_length"),
            min_value: Some(21),   // Min 21 days
            max_value: Some(35),   // Max 35 days
            unusual_change: Some(7), // 7+ days difference from average is unusual
        };
        
        // Period duration threshold
        let period_threshold = HealthMetricThreshold {
            metric_name: String::from_str(env, "period_duration"),
            min_value: Some(2),    // Min 2 days
            max_value: Some(8),    // Max 8 days
            unusual_change: Some(2), // 2+ days difference from average is unusual
        };
        
        // Pain level threshold
        let pain_threshold = HealthMetricThreshold {
            metric_name: String::from_str(env, "pain_level"),
            min_value: None,
            max_value: Some(7),    // Pain level over 7 (on scale of 10) is concerning
            unusual_change: Some(3), // 3+ level increase is unusual
        };
        
        // Store the thresholds
        self.metric_thresholds.set(String::from_str(env, "cycle_length"), cycle_threshold);
        self.metric_thresholds.set(String::from_str(env, "period_duration"), period_threshold);
        self.metric_thresholds.set(String::from_str(env, "pain_level"), pain_threshold);
    }
    
    // Set up default Turret endpoints
    fn setup_default_turrets(&mut self, env: &Env) {
        // In a real implementation, these would be actual Stellar Turret endpoints
        // For the prototype, we'll use placeholders
        
        let cycle_analysis_turret = TurretConfig {
            name: String::from_str(env, "CycleAnalysis"),
            endpoint: String::from_str(env, "https://turret.stellar.org/cycle-analysis"),
            api_key: String::from_str(env, "demo_api_key_1"),
            is_active: true,
        };
        
        let symptom_analysis_turret = TurretConfig {
            name: String::from_str(env, "SymptomAnalysis"),
            endpoint: String::from_str(env, "https://turret.stellar.org/symptom-analysis"),
            api_key: String::from_str(env, "demo_api_key_2"),
            is_active: true,
        };
        
        let prediction_turret = TurretConfig {
            name: String::from_str(env, "CyclePrediction"),
            endpoint: String::from_str(env, "https://turret.stellar.org/prediction"),
            api_key: String::from_str(env, "demo_api_key_3"),
            is_active: true,
        };
        
        // Add the Turrets
        let mut turrets = Vec::new(env);
        turrets.push_back(cycle_analysis_turret);
        turrets.push_back(symptom_analysis_turret);
        turrets.push_back(prediction_turret);
        
        self.turret_endpoints = turrets;
    }
    
    // Configure alerts for a user
    pub fn configure_alerts(
        &mut self,
        env: Env,
        user: Address,
        enabled_types: Vec<AlertType>,
        notification_channels: Vec<String>,
    ) -> Result<(), String> {
        user.require_auth();
        
        // Create or update user's alert configuration
        let config = AlertConfig {
            user: user.clone(),
            enabled_types,
            notification_channels,
            threshold_overrides: Map::new(&env),
            is_active: true,
        };
        
        self.user_alert_configs.set(user, config);
        
        // In a real implementation, this would deploy the monitoring function to the Turrets
        // and set up the necessary hooks
        
        Ok(())
    }
    
    // Override a threshold for a specific user
    pub fn set_threshold_override(
        &mut self,
        env: Env,
        user: Address,
        alert_type: AlertType,
        threshold_value: i128,
    ) -> Result<(), String> {
        user.require_auth();
        
        // Get user's configuration
        let mut config = self.user_alert_configs.get(user.clone())
            .ok_or(String::from_str(&env, "User has no alert configuration"))?;
        
        // Set the override
        config.threshold_overrides.set(alert_type, threshold_value);
        
        // Update the configuration
        self.user_alert_configs.set(user, config);
        
        Ok(())
    }
    
    // Process health data and generate alerts (called by Turret or authorized service)
    pub fn process_health_data(
        &mut self,
        env: Env,
        user: Address,
        data_type: String,
        data_value: i128,
        data_context: String, // JSON string with additional context
    ) -> Result<Vec<Alert>, String> {
        // In a real implementation, this would verify the caller is an authorized Turret
        // For the prototype, we'll allow the user to call this method directly
        user.require_auth();
        
        // Check if user has alert configuration
        let config = self.user_alert_configs.get(user.clone())
            .ok_or(String::from_str(&env, "User has no alert configuration"))?;
        
        // Check if alerts are enabled for the user
        if !config.is_active {
            return Ok(Vec::new(&env));
        }
        
        // Get the threshold for this data type
        let threshold = self.metric_thresholds.get(data_type.clone());
        
        // Generate alerts based on thresholds and user configuration
        let mut new_alerts = Vec::new(&env);
        
        if let Some(threshold) = threshold {
            // Check min threshold
            if let Some(min_value) = threshold.min_value {
                if data_value < min_value {
                    // Value is below minimum threshold
                    let alert = self.create_alert(
                        &env,
                        &user,
                        AlertType::HealthMetricAnomaly,
                        &env.string_utils().concat(
                            &String::from_str(&env, "Low "),
                            &data_type,
                        ),
                        &env.string_utils().concat(
                            &String::from_str(&env, "Your "),
                            &env.string_utils().concat(
                                &data_type,
                                &String::from_str(&env, " is below the recommended range"),
                            ),
                        ),
                        AlertPriority::Medium,
                        Some(data_context),
                    );
                    
                    new_alerts.push_back(alert);
                }
            }
            
            // Check max threshold
            if let Some(max_value) = threshold.max_value {
                if data_value > max_value {
                    // Value is above maximum threshold
                    let alert = self.create_alert(
                        &env,
                        &user,
                        AlertType::HealthMetricAnomaly,
                        &env.string_utils().concat(
                            &String::from_str(&env, "High "),
                            &data_type,
                        ),
                        &env.string_utils().concat(
                            &String::from_str(&env, "Your "),
                            &env.string_utils().concat(
                                &data_type,
                                &String::from_str(&env, " is above the recommended range"),
                            ),
                        ),
                        AlertPriority::Medium,
                        Some(data_context),
                    );
                    
                    new_alerts.push_back(alert);
                }
            }
            
            // In a real implementation, this would do more sophisticated analysis
            // such as trend detection and anomaly detection using Turrets
        }
        
        // Return any newly created alerts
        Ok(new_alerts)
    }
    
    // Helper function to create an alert
    fn create_alert(
        &mut self,
        env: &Env,
        user: &Address,
        alert_type: AlertType,
        title: &String,
        description: &String,
        priority: AlertPriority,
        related_data: Option<String>,
    ) -> Alert {
        // Create a unique alert ID
        let alert_id = env.crypto().sha256(
            &env.serializer().serialize(&(user.clone(), alert_type.clone(), env.ledger().timestamp())).unwrap()
        );
        
        // Create the alert
        let alert = Alert {
            id: alert_id.clone(),
            user: user.clone(),
            alert_type,
            title: title.clone(),
            description: description.clone(),
            priority,
            status: AlertStatus::Active,
            created_at: env.ledger().timestamp(),
            updated_at: env.ledger().timestamp(),
            expires_at: Some(env.ledger().timestamp() + 604800), // Default: expire after 1 week
            related_data,
        };
        
        // Store the alert
        self.alerts.set(alert_id.clone(), alert.clone());
        
        // Update user's alerts
        let mut user_alerts = self.user_alerts.get(user.clone()).unwrap_or(Vec::new(env));
        user_alerts.push_back(alert_id);
        self.user_alerts.set(user.clone(), user_alerts);
        
        // In a real implementation, this would also trigger notifications
        // via the configured notification channels
        
        alert
    }
    
    // Create a custom alert (for testing or manual creation)
    pub fn create_custom_alert(
        &mut self,
        env: Env,
        creator: Address,
        user: Address,
        alert_type: AlertType,
        title: String,
        description: String,
        priority: AlertPriority,
        related_data: Option<String>,
    ) -> BytesN<32> {
        creator.require_auth();
        
        // Check if creator is admin or the user themselves
        if creator != self.admin && creator != user {
            panic!("Only admin or the user can create custom alerts");
        }
        
        // Create the alert
        let alert = self.create_alert(
            &env,
            &user,
            alert_type,
            &title,
            &description,
            priority,
            related_data,
        );
        
        alert.id
    }
    
    // Update alert status
    pub fn update_alert_status(
        &mut self,
        env: Env,
        user: Address,
        alert_id: BytesN<32>,
        status: AlertStatus,
    ) -> Result<(), String> {
        user.require_auth();
        
        // Get the alert
        let mut alert = self.alerts.get(alert_id.clone())
            .ok_or(String::from_str(&env, "Alert not found"))?;
        
        // Check ownership
        if alert.user != user {
            return Err(String::from_str(&env, "Not your alert"));
        }
        
        // Update the status
        alert.status = status;
        alert.updated_at = env.ledger().timestamp();
        
        // Store updated alert
        self.alerts.set(alert_id, alert);
        
        Ok(())
    }
    
    // Get all alerts for a user
    pub fn get_user_alerts(
        &self,
        env: Env,
        user: Address,
    ) -> Vec<Alert> {
        user.require_auth();
        
        let mut result = Vec::new(&env);
        
        if let Some(alert_ids) = self.user_alerts.get(user) {
            for alert_id in alert_ids.iter() {
                if let Some(alert) = self.alerts.get(alert_id) {
                    result.push_back(alert);
                }
            }
        }
        
        result
    }
    
    // Get active alerts for a user
    pub fn get_active_alerts(
        &self,
        env: Env,
        user: Address,
    ) -> Vec<Alert> {
        user.require_auth();
        
        let mut result = Vec::new(&env);
        
        if let Some(alert_ids) = self.user_alerts.get(user) {
            for alert_id in alert_ids.iter() {
                if let Some(alert) = self.alerts.get(alert_id) {
                    if let AlertStatus::Active = alert.status {
                        result.push_back(alert);
                    }
                }
            }
        }
        
        result
    }
    
    // Get user's alert configuration
    pub fn get_alert_config(
        &self,
        env: Env,
        user: Address,
    ) -> Option<AlertConfig> {
        user.require_auth();
        
        self.user_alert_configs.get(user)
    }
    
    // Add a new Turret endpoint (admin only)
    pub fn add_turret_endpoint(
        &mut self,
        env: Env,
        admin: Address,
        name: String,
        endpoint: String,
        api_key: String,
    ) -> Result<(), String> {
        admin.require_auth();
        
        if admin != self.admin {
            return Err(String::from_str(&env, "Only admin can add Turret endpoints"));
        }
        
        // Create the config
        let config = TurretConfig {
            name,
            endpoint,
            api_key,
            is_active: true,
        };
        
        // Add to the list
        self.turret_endpoints.push_back(config);
        
        Ok(())
    }
    
    // Set a health metric threshold (admin only)
    pub fn set_metric_threshold(
        &mut self,
        env: Env,
        admin: Address,
        metric_name: String,
        min_value: Option<i128>,
        max_value: Option<i128>,
        unusual_change: Option<i128>,
    ) -> Result<(), String> {
        admin.require_auth();
        
        if admin != self.admin {
            return Err(String::from_str(&env, "Only admin can set metric thresholds"));
        }
        
        // Create the threshold
        let threshold = HealthMetricThreshold {
            metric_name: metric_name.clone(),
            min_value,
            max_value,
            unusual_change,
        };
        
        // Store it
        self.metric_thresholds.set(metric_name, threshold);
        
        Ok(())
    }
    
    // Get a health metric threshold
    pub fn get_metric_threshold(
        &self,
        env: Env,
        metric_name: String,
    ) -> Option<HealthMetricThreshold> {
        self.metric_thresholds.get(metric_name)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};
    
    #[test]
    fn test_health_alerts_flow() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        
        // Initialize contract
        let mut contract = HealthAlertContract::initialize(env.clone(), admin.clone());
        
        // Configure alerts for user
        let mut enabled_types = Vec::new(&env);
        enabled_types.push_back(AlertType::HealthMetricAnomaly);
        enabled_types.push_back(AlertType::IrregularCycle);
        
        let mut notification_channels = Vec::new(&env);
        notification_channels.push_back(String::from_str(&env, "email"));
        
        contract.configure_alerts(
            env.clone(),
            user.clone(),
            enabled_types,
            notification_channels,
        ).unwrap();
        
        // Process health data with abnormal value (should generate alert)
        let data_context = String::from_str(&env, "{\"average\": 28, \"previous\": 29}");
        
        let alerts = contract.process_health_data(
            env.clone(),
            user.clone(),
            String::from_str(&env, "cycle_length"),
            40, // Abnormally long cycle
            data_context,
        ).unwrap();
        
        // Should generate one alert
        assert_eq!(alerts.len(), 1);
        
        // Create a custom alert
        let alert_id = contract.create_custom_alert(
            env.clone(),
            admin.clone(),
            user.clone(),
            AlertType::MedicationReminder,
            String::from_str(&env, "Medication Reminder"),
            String::from_str(&env, "Remember to take your medication"),
            AlertPriority::Medium,
            None,
        );
        
        // Get active alerts
        let active_alerts = contract.get_active_alerts(env.clone(), user.clone());
        assert_eq!(active_alerts.len(), 2); // Should have both alerts
        
        // Mark one alert as resolved
        contract.update_alert_status(
            env.clone(),
            user.clone(),
            alert_id,
            AlertStatus::Resolved,
        ).unwrap();
        
        // Check active alerts again
        let active_alerts = contract.get_active_alerts(env.clone(), user.clone());
        assert_eq!(active_alerts.len(), 1); // Should now have one alert
    }
} 