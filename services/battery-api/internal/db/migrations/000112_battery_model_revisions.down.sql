-- Remove the model revision foundation when rolling back an unused migration.
DROP TABLE public.battery_model_revisions;
DROP FUNCTION public.protect_released_battery_model_revision();
DROP TABLE public.battery_models;
