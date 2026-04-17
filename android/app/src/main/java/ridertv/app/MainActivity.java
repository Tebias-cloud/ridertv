package ridertv.app;

import android.media.AudioManager;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Vincular los botones de volumen del control remoto al flujo de música/video
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
    }

    @Override
    public void onBackPressed() {
        // En Android TV, queremos que Capacitor controle el botón atrás 
        // para cerrar el reproductor nativo antes de cerrar la app.
        super.onBackPressed();
    }
}