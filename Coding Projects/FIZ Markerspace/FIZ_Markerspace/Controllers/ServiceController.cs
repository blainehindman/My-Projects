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
    public class ServiceController : Controller
    {
        private fiz_markerspaceEntities db = new fiz_markerspaceEntities();
        // GET: Service
        public ActionResult Service_Machine()
        {
            dynamic Service_Machines_Model = new ExpandoObject();
            Service_Machines_Model.Machines = db.Machines.ToList();
            return View(Service_Machines_Model);
        }

        [HttpPost]
        public JsonResult Service_Machine(string AUTH_WSU_ID, string AUTH_PASSWORD, string MACHINE_NAME)
        {
            User auth_user = db.Users.SingleOrDefault(user => user.wsu_id == AUTH_WSU_ID);
            //Check if Machine exits
            Machine check_exist_machinename = db.Machines.SingleOrDefault(machine => machine.machine_name == MACHINE_NAME);

            //check exisitance
            if (check_exist_machinename == null)
            {
                var return_data = new { result = false, message = "This Machine Not Found!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }

            if ((auth_user != null && auth_user.password == AUTH_PASSWORD))
            {

                //update machine
                check_exist_machinename.service_flag = 0;
                check_exist_machinename.hardware_service_flag = 0;
                check_exist_machinename.usage_time = 0;

                db.Entry(check_exist_machinename).State = EntityState.Modified;
                db.SaveChanges();

                //add to service log
                ServiceLog serviceLog = new ServiceLog();

                serviceLog.service_id = Guid.NewGuid();
                serviceLog.user_id = auth_user.user_id;
                serviceLog.wsu_id = auth_user.wsu_id;
                serviceLog.first_name = auth_user.first_name;
                serviceLog.last_name = auth_user.last_name;
                serviceLog.room_id = check_exist_machinename.room_id;
                serviceLog.room_name = check_exist_machinename.room_name;
                serviceLog.machine_id = check_exist_machinename.machine_id;
                serviceLog.machine_name = check_exist_machinename.machine_name;
                serviceLog.time_stamp = DateTime.Now.ToString("dddd, dd MMMM yyyy HH:mm:ss");
                serviceLog.notes = "";

                db.ServiceLogs.Add(serviceLog);
                db.SaveChanges();



                var return_data = new { result = true, message = "You serviced " + MACHINE_NAME + "!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }
            else
            {
                var return_data = new { result = false, message = "Your authentication credentials failed!" };
                return Json(return_data, JsonRequestBehavior.AllowGet);
            }

        }

    }
}