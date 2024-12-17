using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Dynamic;
using System.Web.Mvc;
using FIZ_Markerspace.Models;

namespace FIZ_Markerspace.Controllers
{
    public class SimulationController : Controller
    {
        private fiz_markerspaceEntities db = new fiz_markerspaceEntities();

        // GET: Simulation
        public ActionResult Simulation()
        {
            return View();
        }

        [HttpPost]
        public JsonResult Check_RFID(string RFID_TAG, string MACHINE_NAME)
        {
            //Check user
            User check_user = db.Users.SingleOrDefault(user => user.rfid_tag == RFID_TAG);
            if (check_user == null)
            {
                var return_data = new { result = false, message = "User was not found!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }
            //Check Machine level
            Machine check_machine = db.Machines.SingleOrDefault(machine => machine.machine_name == MACHINE_NAME);
            if(check_user.role < check_machine.role_access)
            {
                var return_data = new { result = false, message = "User does not have permission to access to this machine!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }
            //Check Room Access
            RoomAccess check_roomAccess = db.RoomAccesses.SingleOrDefault(roomAccess => roomAccess.user_id == check_user.user_id && roomAccess.room_name == check_machine.room_name);
            if (check_roomAccess == null)
            {
                var return_data = new { result = false, message = "User cannot access to this room!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }
            //Pass all Checks
            if (check_user != null && check_roomAccess != null && check_user.role >= check_machine.role_access)
            {
                //Random Numbers for time simulation
                Random time_used = new Random();
                double Machine_Time_Value = Math.Round(time_used.NextDouble(), 2);
                //Random Numbers for hardware flag simulation
                Random hardware_flag = new Random();
                int Hardware_Flag_Value = hardware_flag.Next(0,2);

                //Add to machine Log
                MachineLog machineLog = new MachineLog();

                machineLog.machine_log_id = Guid.NewGuid();
                machineLog.user_id = check_user.user_id;
                machineLog.wsu_id = check_user.wsu_id;
                machineLog.first_name = check_user.first_name;
                machineLog.last_name = check_user.last_name;
                machineLog.room_id = check_roomAccess.room_id;
                machineLog.room_name = check_roomAccess.room_name;
                machineLog.machine_id = check_machine.machine_id;
                machineLog.machine_name = check_machine.machine_name;
                machineLog.time_used = Machine_Time_Value;
                machineLog.end_time_stamp = DateTime.Now.ToString("dddd, dd MMMM yyyy HH:mm:ss");

                db.MachineLogs.Add(machineLog);
                db.SaveChanges();

                //Update Machine Data
                Machine machine = check_machine;

                machine.hardware_service_flag = Hardware_Flag_Value;
                machine.total_usage_time = (machine.total_usage_time + Machine_Time_Value);
                machine.usage_time = (machine.usage_time + Machine_Time_Value);

                db.Entry(machine).State = EntityState.Modified;
                db.SaveChanges();

                //display time used
                double Return_Time = (Machine_Time_Value * 60);
                var return_data = new { result = true, message = check_user.first_name + " used the " + check_machine.machine_name + " for " + Return_Time + " minutes!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }
            else
            {
                var return_data = new { result = false, message = "Unknown error, please try again!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult Create_Machine_Log()
        {
            return Json(null);
        }
    }
}