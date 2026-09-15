CREATE TRIGGER on_auth_user_created_provision_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION private.provision_profile_on_signup();
