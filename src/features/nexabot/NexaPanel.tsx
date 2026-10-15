import type { NexaController } from './useNexabot';
import { NexaConnection } from './NexaConnection';
import { NexaGeneration } from './NexaGeneration';
import { NexaJobs } from './NexaJobs';
import { nexaErrorMessage } from './errors';
const activities = {
  idle: 'Siap',
  loading: 'Membaca penyimpanan…',
  saving: 'Menyimpan key…',
  credit: 'Memeriksa saldo…',
  preparing: 'Memeriksa biaya…',
  submitting: 'Mengirim satu request…',
  monitoring: 'Memantau dan mengambil hasil…',
};
export function NexaPanel(props: NexaController) {
  const { state, error } = props;
  return (
    <div className="nexa-panel">
      <p role="status">{state ? activities[state.activity] : 'Menghubungkan aplikasi…'}</p>
      {(error || state?.error) && (
        <p role="alert" className="nexa-error">
          {error ?? nexaErrorMessage(state?.error)}
        </p>
      )}
      <NexaConnection {...props} />
      <NexaGeneration {...props} />
      <NexaJobs {...props} />
    </div>
  );
}
