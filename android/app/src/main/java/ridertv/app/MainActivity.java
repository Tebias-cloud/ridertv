package ridertv.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onBackPressed() {
        // En Android TV, queremos que Capacitor controle el botón atrás 
        // para cerrar el reproductor nativo antes de cerrar la app.
        super.onBackPressed();
    }
}
