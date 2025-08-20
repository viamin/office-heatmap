admin_email = ENV.fetch("ADMIN_EMAIL", "admin@example.com")
admin_password = ENV.fetch("ADMIN_PASSWORD", "changeme123")

if defined?(Admin)
  Admin.where(email: admin_email).first_or_create! do |admin|
    admin.password = admin_password
    admin.password_confirmation = admin_password
  end
end

Floorplan.first_or_create!(name: "Main Office")
