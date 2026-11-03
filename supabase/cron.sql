-- This schedules only LEGO queue maintenance; it does not call BrickLink.
create extension if not exists pg_cron;
select cron.schedule(
  'lego-market-refresh-v1',
  '*/15 * * * *',
  $job$select lego_market.tick();
    delete from cron.job_run_details
    where jobid=(select jobid from cron.job where jobname='lego-market-refresh-v1')
      and end_time < now()-interval '7 days';$job$
);
